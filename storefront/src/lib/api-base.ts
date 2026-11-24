/** Base URL of the ThriftStore .NET API (admin/), always ending in "/". */
export function apiBaseUrl(): string {
  // ThriftStoreApi__BaseUrl / AlieBrechoApi__BaseUrl: names already set on the Render service of the old Razor store.
  const raw =
    process.env.THRIFT_API_URL ||
    process.env.ThriftStoreApi__BaseUrl ||
    process.env.AlieBrechoApi__BaseUrl ||
    "http://localhost:5000/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}
