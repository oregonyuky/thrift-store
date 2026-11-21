"""Exercise the published apps locally. Never uses an existing database or live secrets."""
from contextlib import ExitStack, closing
from http.cookiejar import CookieJar
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPCookieProcessor, ProxyHandler, Request, build_opener
import html
import json
import os
import re
import secrets
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
PUBLISH = ROOT / "artifacts" / "publish"


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def request(url, data=None, headers=None, opener=None, method=None):
    opener = opener or build_opener(ProxyHandler({}))
    req = Request(url, data=data, headers=headers or {}, method=method)
    try:
        response = opener.open(req, timeout=15)
    except HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read()


def stop(process):
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)


def start(stack, folder, dll, env, name):
    log = stack.enter_context((folder.parent / (name + ".log")).open("wb"))
    process = subprocess.Popen(
        ["dotnet", dll], cwd=folder, env=env,
        stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )
    process.smoke_log = folder.parent / (name + ".log")
    stack.callback(stop, process)
    return process


def ready(process, url):
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        if process.poll() is not None:
            tail = process.smoke_log.read_text(errors="replace")[-3500:]
            raise AssertionError(f"Application exited with code {process.returncode}:\n{tail}")
        try:
            if request(url + "healthz")[0] == 200:
                return
        except (URLError, TimeoutError, ConnectionError):
            pass
        time.sleep(0.3)
    raise AssertionError("Health check did not become ready")


def check(condition, label):
    if not condition:
        raise AssertionError(label)
    print("PASS " + label, flush=True)


def startup_rejected(process, marker, url):
    # Windows Error Reporting may keep a crashed process alive after an unhandled
    # exception. Assert the specific failure and absence of HTTP service, then reap it.
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if marker in process.smoke_log.read_text(errors="replace"):
            try:
                serving = request(url + "healthz")[0] == 200
            except (URLError, TimeoutError, ConnectionError):
                serving = False
            stop(process)
            return not serving
        if process.poll() is not None:
            return False
        time.sleep(0.2)
    stop(process)
    raise AssertionError(process.smoke_log.read_text(errors="replace")[-3000:])


def main():
    for name, dll in [("admin", "ASPNET.dll"), ("web", "AlieBrecho.Presentation.dll")]:
        if not (PUBLISH / name / dll).is_file():
            raise SystemExit("Publish both applications to artifacts/publish first; see README.md.")
    # Copy only trusted publications to a fresh workspace, without prior runtime state.
    with tempfile.TemporaryDirectory(prefix="smoke-", dir=ROOT / "artifacts") as directory:
        workspace = Path(directory).resolve()
        workspace.relative_to((ROOT / "artifacts").resolve())
        for name in ("admin", "web"):
            shutil.copytree(PUBLISH / name, workspace / name,
                            ignore=shutil.ignore_patterns("*.db*", ".env*", "DataProtectionKeys", "dataprotection-keys", "logs"))
        with ExitStack() as stack:
            # Allowlist OS variables so an inherited DATABASE_URL, .NET setting or token cannot escape.
            allowed = {"path", "systemroot", "windir", "temp", "tmp", "home", "userprofile",
                       "dotnet_root", "dotnet_cli_home", "dotnet_bundle_extract_base_dir"}
            common = {k: v for k, v in os.environ.items() if k.lower() in allowed}
            common.update({"ASPNETCORE_ENVIRONMENT": "Production", "DOTNET_NOLOGO": "1",
                           "ASPNETCORE_FORWARDEDHEADERS_ENABLED": "true",
                           "Logging__LogLevel__Default": "Warning"})
            admin_port, web_port = free_port(), free_port()
            while web_port == admin_port:
                web_port = free_port()
            admin_url, web_url = f"http://127.0.0.1:{admin_port}/", f"http://127.0.0.1:{web_port}/"
            password = secrets.token_urlsafe(24) + "!aA1"
            database = workspace / "test.db"
            admin_env = dict(common, PORT=str(admin_port), DatabaseProvider="Sqlite",
                             ConnectionStrings__DefaultConnection=f"Data Source={database}",
                             DatabaseInitialization__Enabled="true", IsDemoVersion="false",
                             Jwt__Key=secrets.token_urlsafe(48), Jwt__Issuer="smoke", Jwt__Audience="smoke",
                             AspNetIdentity__DefaultAdmin__Email="admin@example.invalid",
                             AspNetIdentity__DefaultAdmin__Password=password,
                             Cors__AllowedOrigins__0=web_url.rstrip("/"))
            admin = start(stack, workspace / "admin", "ASPNET.dll", admin_env, "admin")
            ready(admin, admin_url)
            check(database.exists() and not (workspace / "admin" / "app.db").exists(),
                  "admin honors explicit connection string and PORT")
            check(request(admin_url + "api/Product/GetProductList")[0] == 200, "public catalog API")
            check(request(admin_url + "adminlte/css/adminlte.min.css")[0] == 200,
                  "published admin static assets")
            image = next((workspace / "admin" / "wwwroot" / "app_data" / "images").glob("*.png"))
            check(request(admin_url + "api/FileImage/GetImage?" + urlencode({"imageName": image.name}))[0] == 200,
                  "product images")
            headers = {"Origin": web_url.rstrip("/"), "Access-Control-Request-Method": "POST"}
            status, response_headers, _ = request(admin_url + "hubs/catalog/negotiate?negotiateVersion=1",
                                                  headers=headers, method="OPTIONS")
            check(status == 204 and response_headers.get("Access-Control-Allow-Origin") == web_url.rstrip("/")
                  and response_headers.get("Access-Control-Allow-Credentials") == "true", "SignalR CORS preflight")
            headers["Origin"] = "https://untrusted.example.invalid"
            check(request(admin_url + "hubs/catalog/negotiate", headers=headers, method="OPTIONS")[1]
                  .get("Access-Control-Allow-Origin") is None, "unconfigured CORS origin rejected")
            check(request(admin_url + "hubs/catalog/negotiate?negotiateVersion=1", data=b"")[0] == 200,
                  "public SignalR negotiation")
            check(request(admin_url + "hubs/orders/negotiate?negotiateVersion=1", data=b"")[0] in (401, 403),
                  "protected SignalR hub requires authentication")
            customer = {"name": "Local smoke customer", "emailAddress": "customer@example.invalid",
                        "password": password, "confirmPassword": password}
            check(request(admin_url + "api/Customer/CreateCustomer", json.dumps(customer).encode(),
                          {"Content-Type": "application/json"})[0] == 200, "customer created only in disposable database")
            web_env = dict(common, PORT=str(web_port), ThriftStoreApi__BaseUrl=admin_url,
                           AlieBrechoApi__BaseUrl="http://127.0.0.1:1/", Instagram__AccessToken="")
            web = start(stack, workspace / "web", "AlieBrecho.Presentation.dll", web_env, "web")
            ready(web, web_url)
            check(request(admin_url + "healthz")[0] == request(web_url + "healthz")[0] == 200,
                  "both published apps start in Production and return healthz")
            status, headers, _ = request(web_url + "healthz", headers={
                "X-Forwarded-Proto": "https", "Host": "store.example.invalid"})
            check(status == 200 and headers.get("Strict-Transport-Security") is not None,
                  "forwarded HTTPS is recognized behind the Render proxy")
            status, _, page = request(web_url)
            check(status == 200 and (admin_url + "hubs/catalog").encode() in page,
                  "storefront renders public hub URL from ThriftStoreApi alias")
            check(request(web_url + "css/site.css")[0] == 200, "published storefront static assets")
            check(request(web_url + "api/catalog/snapshot")[0] == 200, "storefront catalog handler")
            jar = CookieJar()
            browser = build_opener(ProxyHandler({}), HTTPCookieProcessor(jar))
            status, _, page = request(web_url + "Account/Login", opener=browser)
            token = re.search(rb'name="__RequestVerificationToken"[^>]*value="([^"]+)"', page)
            check(status == 200 and token is not None, "login route and antiforgery token")
            form = {"Input.Email": customer["emailAddress"], "Input.Password": password,
                    "__RequestVerificationToken": html.unescape(token.group(1).decode())}
            status, _, _ = request(web_url + "Account/Login", urlencode(form).encode(),
                                   {"Content-Type": "application/x-www-form-urlencoded"}, browser)
            check(status == 200 and any(c.name.startswith(".AspNetCore.Cookies") for c in jar),
                  "storefront login exchanges credentials for API JWT and local auth cookie")
            status, _, page = request(web_url + "Orders", opener=browser)
            check(status == 200 and b'name="Input.Password"' not in page, "authenticated storefront route")
            check(any((workspace / "web" / "App_Data" / "DataProtectionKeys").glob("key-*.xml")),
                  "storefront writes persistent protection keys")
            stop(web)
            web = start(stack, workspace / "web", "AlieBrecho.Presentation.dll", web_env, "web-restart")
            ready(web, web_url)
            status, _, page = request(web_url + "Orders", opener=browser)
            check(status == 200 and b'name="Input.Password"' not in page,
                  "authentication cookie survives storefront restart with retained keys")
            stop(admin)
            with closing(sqlite3.connect(database)) as connection:
                before = "\n".join(connection.iterdump())
            admin_env["DatabaseInitialization__Enabled"] = "false"
            admin = start(stack, workspace / "admin", "ASPNET.dll", admin_env, "admin-restart")
            ready(admin, admin_url)
            with closing(sqlite3.connect(database)) as connection:
                after = "\n".join(connection.iterdump())
            check(before == after, "restart with initialization disabled preserves schema and test data")
            stop(admin)
            missing_env = dict(admin_env, ConnectionStrings__DefaultConnection="", DATABASE_URL="")
            missing = start(stack, workspace / "admin", "ASPNET.dll", missing_env, "missing-database")
            check(startup_rejected(missing, "Configure DATABASE_URL", admin_url)
                  and not (workspace / "admin" / "app.db").exists(),
                  "Production rejects missing database instead of silently creating SQLite")
            stop(web)
            invalid_env = dict(web_env, ThriftStoreApi__BaseUrl="ftp://invalid.example/")
            invalid = start(stack, workspace / "web", "AlieBrecho.Presentation.dll", invalid_env, "invalid-url")
            check(startup_rejected(invalid, "must be an absolute HTTP(S) URL", web_url),
                  "storefront rejects invalid API URL at startup")


if __name__ == "__main__":
    main()
