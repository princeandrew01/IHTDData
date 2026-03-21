import heroesJson from "../data/heroes.json";
import mapsJson from "../data/maps.json";

const hasImportMeta = typeof import.meta !== "undefined";
const isDevelopment = hasImportMeta && Boolean(import.meta.env?.DEV);

export function createSpotId(mapId, spotIndex) {
  return `${mapId}_spot_${String(spotIndex + 1).padStart(2, "0")}`;
}

export function cloneSpot(spot, fallbackMapId = "map", fallbackIndex = 0) {
  return normalizeSpot(fallbackMapId, spot, fallbackIndex);
}

export function normalizeMapSpots(mapId, spots = []) {
  return Array.isArray(spots)
    ? spots.map((spot, index) => normalizeSpot(mapId, spot, index))
    : [];
}

export function cloneSpots(spots = [], mapId = "map") {
  return normalizeMapSpots(mapId, spots);
}

function toFiniteNumber(value) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeSpot(mapId, spot, index) {
  const fallbackId = createSpotId(mapId, index);
  const x = toFiniteNumber(spot?.x);
  const y = toFiniteNumber(spot?.y);

  return {
    ...spot,
    id: typeof spot?.id === "string" && spot.id.trim() ? spot.id : fallbackId,
    label: typeof spot?.label === "string" && spot.label.trim() ? spot.label : `Spot ${index + 1}`,
    x: x ?? 0,
    y: y ?? 0,
  };
}

function normalizeMap(map) {
  return {
    ...map,
    spots: normalizeMapSpots(map.id, map?.spots),
  };
}

function collectHeroIssues(heroes) {
  const issues = [];
  const seenHeroIds = new Set();

  heroes.forEach((hero, index) => {
    if (typeof hero?.id !== "string" || !hero.id.trim()) {
      issues.push(`Hero at index ${index} is missing a string id.`);
    } else if (seenHeroIds.has(hero.id)) {
      issues.push(`Duplicate hero id detected: ${hero.id}.`);
    } else {
      seenHeroIds.add(hero.id);
    }

    if (typeof hero?.name !== "string" || !hero.name.trim()) {
      issues.push(`Hero ${hero?.id ?? `(index ${index})`} is missing a display name.`);
    }
  });

  return issues;
}

function collectMapIssues(maps) {
  const issues = [];
  const seenMapIds = new Set();

  maps.forEach((map, mapIndex) => {
    if (typeof map?.id !== "string" || !map.id.trim()) {
      issues.push(`Map at index ${mapIndex} is missing a string id.`);
      return;
    }

    if (seenMapIds.has(map.id)) {
      issues.push(`Duplicate map id detected: ${map.id}.`);
    } else {
      seenMapIds.add(map.id);
    }

    if (typeof map?.name !== "string" || !map.name.trim()) {
      issues.push(`Map ${map.id} is missing a display name.`);
    }

    if (!Array.isArray(map?.spots)) {
      issues.push(`Map ${map.id} is missing its spots array.`);
      return;
    }

    const seenSpotIds = new Set();
    map.spots.forEach((spot, spotIndex) => {
      if (typeof spot?.id !== "string" || !spot.id.trim()) {
        issues.push(`Map ${map.id} has a spot at index ${spotIndex} without an id.`);
      } else if (seenSpotIds.has(spot.id)) {
        issues.push(`Map ${map.id} has a duplicate spot id: ${spot.id}.`);
      } else {
        seenSpotIds.add(spot.id);
      }

      if (spot.x < 0 || spot.x > 1 || spot.y < 0 || spot.y > 1) {
        issues.push(`Map ${map.id} has out-of-range coordinates on spot ${spot.id}.`);
      }
    });
  });

  return issues;
}

function warnIssues(label, issues) {
  if (!isDevelopment || !issues.length) {
    return;
  }

  console.warn(`[gameData] ${label} validation issues:`);
  issues.forEach((issue) => console.warn(`[gameData] ${issue}`));
}

const normalizedHeroes = Array.isArray(heroesJson.heroes) ? heroesJson.heroes.map((hero) => ({ ...hero })) : [];
const normalizedMaps = Array.isArray(mapsJson.maps) ? mapsJson.maps.map(normalizeMap) : [];

warnIssues("heroes", collectHeroIssues(normalizedHeroes));
warnIssues("maps", collectMapIssues(normalizedMaps));

export const heroesData = Object.freeze({
  ...heroesJson,
  heroes: normalizedHeroes,
});

export const mapsData = Object.freeze({
  ...mapsJson,
  maps: normalizedMaps,
});

export const heroList = heroesData.heroes;
export const mapList = mapsData.maps;

export const heroById = Object.freeze(
  Object.fromEntries(heroList.map((hero) => [hero.id, hero]))
);

export const mapById = Object.freeze(
  Object.fromEntries(mapList.map((map) => [map.id, map]))
);

export function getInitialMapSpotsById() {
  return Object.fromEntries(
    mapList.map((map) => [map.id, cloneSpots(map.spots, map.id)])
  );
}

export function getMapSpotsByIdFromMapsRoot(mapsRoot, fallbackSpotsById = getInitialMapSpotsById()) {
  if (!mapsRoot || !Array.isArray(mapsRoot.maps)) {
    throw new Error("The provided maps data does not contain a top-level maps array.");
  }

  const nextSpotsById = { ...fallbackSpotsById };
  for (const map of mapList) {
    const matchingMap = mapsRoot.maps.find((item) => item?.id === map.id);
    if (matchingMap) {
      nextSpotsById[map.id] = normalizeMapSpots(map.id, matchingMap.spots);
    }
  }

  return nextSpotsById;
}

export function parseMapSpotsByIdFromJsonText(rawJsonText, fallbackSpotsById = getInitialMapSpotsById()) {
  let parsed;

  try {
    parsed = JSON.parse(rawJsonText);
  } catch {
    throw new Error("The selected file could not be parsed as valid JSON.");
  }

  return getMapSpotsByIdFromMapsRoot(parsed, fallbackSpotsById);
}

export function mergeMapsWithSpots(maps, spotsById) {
  return maps.map((map) => ({
    ...map,
    spots: cloneSpots(spotsById?.[map.id] ?? map.spots, map.id),
  }));
}

export function getHeroImageName(hero) {
  return hero?.heroIcon ?? null;
}

export function getMapImageName(map) {
  return map?.image ?? map?.icon ?? null;
}