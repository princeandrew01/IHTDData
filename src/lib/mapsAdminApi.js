const baseUrl = import.meta.env.BASE_URL ?? "/";
const adminEndpoint = `${baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl}/__admin/maps-json`.replace(/^\/\//, "/");

async function parseResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? "maps.json request failed.");
  }
  return payload;
}

export async function readMapsJsonFromServer() {
  const response = await fetch(adminEndpoint, { method: "GET" });
  return parseResponse(response);
}

export async function writeMapSpotsToServer(mapId, spots) {
  const response = await fetch(adminEndpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mapId, spots }),
  });
  return parseResponse(response);
}