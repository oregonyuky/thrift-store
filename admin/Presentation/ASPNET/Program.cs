using ASPNET.BackEnd;
using ASPNET.BackEnd.Common.Middlewares;
using DotNetEnv;
using Microsoft.AspNetCore.DataProtection;
using Npgsql;

LoadEnvironmentVariables();

var builder = WebApplication.CreateBuilder(args);

ConfigureEnvironmentSecrets(builder);
ConfigureRender(builder);

//>>> Create Logs folder for Serilog
var logPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "app_data", "logs");
if (!Directory.Exists(logPath))
{
    Directory.CreateDirectory(logPath);
}

var dataProtectionPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "app_data", "dataprotection-keys");
Directory.CreateDirectory(dataProtectionPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath));

builder.Services.AddBackEndServices(builder.Configuration);

var app = builder.Build();

app.RegisterBackEndBuilder(app.Environment, app, builder.Configuration);

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseRouting();
app.UseCors();
app.UseMiddleware<GlobalApiExceptionHandlerMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapStaticAssets();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous();

app.MapBackEndRoutes();

// The old Razor admin pages are gone: the staff panel is now /painel in the store app.
// Anyone opening this service in a browser is sent there; unknown API paths still get 404.
var storeUrl = (Environment.GetEnvironmentVariable("STORE_URL") ?? "https://thrift-store-web.onrender.com").TrimEnd('/');
app.MapGet("/", () => Results.Redirect($"{storeUrl}/painel"))
    .AllowAnonymous()
    .ExcludeFromDescription();
app.MapFallback((HttpContext context) =>
        context.Request.Path.StartsWithSegments("/api") || context.Request.Path.StartsWithSegments("/swagger")
            ? Results.NotFound()
            : Results.Redirect($"{storeUrl}/painel"))
    .AllowAnonymous()
    .ExcludeFromDescription();

app.Run();

static void LoadEnvironmentVariables()
{
    var candidates = new[]
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.Combine(Directory.GetCurrentDirectory(), "Presentation", "ASPNET", ".env"),
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env"))
    };

    foreach (var path in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
    {
        if (File.Exists(path))
        {
            Env.Load(path);
        }
    }
}

static void ConfigureRender(WebApplicationBuilder builder)
{
    if (int.TryParse(Environment.GetEnvironmentVariable("PORT"), out var renderPort))
    {
        builder.WebHost.UseUrls($"http://0.0.0.0:{renderPort}");
    }

    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (string.IsNullOrWhiteSpace(databaseUrl))
    {
        // Respect the standard ASP.NET configuration, including environment variables.
        if (!string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
        {
            if (string.IsNullOrWhiteSpace(builder.Configuration["DatabaseProvider"]))
            {
                throw new InvalidOperationException("DatabaseProvider is required with ConnectionStrings__DefaultConnection.");
            }

            return;
        }

        if (!builder.Environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Configure DATABASE_URL or DatabaseProvider and ConnectionStrings__DefaultConnection. " +
                "The SQLite fallback is available only in Development.");
        }

        builder.Configuration["DatabaseProvider"] = "Sqlite";
        builder.Configuration["ConnectionStrings:DefaultConnection"] = "Data Source=app.db";
        return;
    }

    if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri) ||
        (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
    {
        throw new InvalidOperationException("DATABASE_URL must be a valid PostgreSQL URL.");
    }

    var credentials = uri.UserInfo.Split(':', 2);
    if (credentials.Length != 2)
    {
        throw new InvalidOperationException("DATABASE_URL must include a username and password.");
    }

    var connectionString = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.IsDefaultPort ? 5432 : uri.Port,
        Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
        Username = Uri.UnescapeDataString(credentials[0]),
        Password = Uri.UnescapeDataString(credentials[1]),
        SslMode = SslMode.Prefer
    };

    builder.Configuration["DatabaseProvider"] = "PostgreSQL";
    builder.Configuration["ConnectionStrings:DefaultConnection"] = connectionString.ConnectionString;
}

static void ConfigureEnvironmentSecrets(WebApplicationBuilder builder)
{
    var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY");
    if (!string.IsNullOrWhiteSpace(jwtKey))
    {
        builder.Configuration["Jwt:Key"] = jwtKey;
    }

    var customerGoogleClientId = Environment.GetEnvironmentVariable("CUSTOMER_CLIENT_ID");
    if (!string.IsNullOrWhiteSpace(customerGoogleClientId))
    {
        builder.Configuration["Google:Customer:ClientId"] = customerGoogleClientId.Trim();
    }

    builder.Configuration["FileImageManager:SupabaseUrl"] =
        Environment.GetEnvironmentVariable("SUPABASE_URL") ?? string.Empty;
    builder.Configuration["FileImageManager:SupabaseServiceRoleKey"] =
        Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY") ?? string.Empty;
    builder.Configuration["FileImageManager:SupabaseStorageBucket"] =
        Environment.GetEnvironmentVariable("SUPABASE_STORAGE_BUCKET") ?? "products";
}
