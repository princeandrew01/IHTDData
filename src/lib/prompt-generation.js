import { roundCoord } from "./coords";

export const MAPS_JSON_PATH = "C:\\Users\\TUF\\Desktop\\other\\IHTDData\\src\\data\\maps.json";

function sortSpots(spots) {
  return [...spots].sort((left, right) => left.id.localeCompare(right.id, undefined, { numeric: true }));
}

export function getSerializableSpots(spots) {
  return sortSpots(spots).map((spot) => ({
    id: spot.id,
    label: spot.label,
    x: roundCoord(spot.x, 3),
    y: roundCoord(spot.y, 3),
  }));
}

export function serializeSpots(spots) {
  return JSON.stringify(
    getSerializableSpots(spots),
    null,
    2
  );
}

export function updateMapsJsonContent(rawJsonText, mapId, spots) {
  let parsed;

  try {
    parsed = JSON.parse(rawJsonText);
  } catch {
    throw new Error("The selected maps.json file could not be parsed as valid JSON.");
  }

  if (!parsed || !Array.isArray(parsed.maps)) {
    throw new Error("The selected JSON file does not contain a top-level maps array.");
  }

  const targetMap = parsed.maps.find((map) => map?.id === mapId);
  if (!targetMap) {
    throw new Error(`Could not find a map record with id \"${mapId}\" in the selected file.`);
  }

  targetMap.spots = getSerializableSpots(spots);
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export function buildMapsUpdatePrompt(map, spots) {
  const mapId = map?.id ?? "unknown_map";
  const mapName = map?.name ?? "Unknown Map";
  const finalSpots = serializeSpots(spots);

  return [
    `Update the file \"${MAPS_JSON_PATH}\".`,
    "",
    `Find the map record with id \"${mapId}\" and name \"${mapName}\".`,
    "Add or replace only its \"spots\" array with the exact final values below.",
    "Preserve all unrelated fields on that map record and preserve all other map records exactly as they are.",
    "",
    "Important constraints:",
    "- keep all coordinates normalized between 0 and 1",
    "- do not convert these values to pixels",
    "- keep spot ids and labels exactly as provided",
    "- do not reorder unrelated map records unless the formatter requires it",
    "- preserve existing non-spot fields such as perks, icon, unlock costs, and negativePerk",
    "",
    "Set the final spots array to:",
    "",
    finalSpots,
    "",
    "After updating maps.json, verify that the loadout builder and coord finder still read the updated map data correctly.",
  ].join("\n");
}