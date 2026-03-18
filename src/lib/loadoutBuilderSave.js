export const LOADOUT_BUILDER_SELECTED_MAP_STORAGE_KEY = "ihtddata.loadoutBuilder.selectedMapId";
export const LOADOUT_BUILDER_PLACEMENTS_STORAGE_KEY = "ihtddata.loadoutBuilder.placements.v1";
export const APP_SAVE_VERSION = 3;

import { normalizeStatsLoadoutState, readStatsLoadoutState, writeStatsLoadoutState } from "./statsLoadout";
import { normalizeMapLoadoutState, readMapLoadoutState, writeMapLoadoutState } from "./mapLoadout";

function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function readLoadoutBuilderState(storage = localStorage) {
  let placementsByMap = {};

  try {
    const parsedPlacements = JSON.parse(storage.getItem(LOADOUT_BUILDER_PLACEMENTS_STORAGE_KEY) ?? "{}");
    if (isObject(parsedPlacements)) {
      placementsByMap = parsedPlacements;
    }
  } catch {
    placementsByMap = {};
  }

  return {
    selectedMapId: storage.getItem(LOADOUT_BUILDER_SELECTED_MAP_STORAGE_KEY) ?? "",
    placementsByMap,
  };
}

export function buildAppSavePayload(storage = localStorage) {
  return {
    version: APP_SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    sections: {
      loadoutBuilder: readLoadoutBuilderState(storage),
      statsLoadout: readStatsLoadoutState(storage),
      mapLoadout: readMapLoadoutState(storage),
    },
  };
}

export function validateAppSavePayload(payload) {
  if (!isObject(payload)) {
    return { ok: false, message: "Save file is not a JSON object." };
  }

  if (!isObject(payload.sections)) {
    return { ok: false, message: "Save file is missing sections data." };
  }

  const loadoutBuilder = payload.sections.loadoutBuilder;
  if (!isObject(loadoutBuilder)) {
    return { ok: false, message: "Save file is missing loadout builder data." };
  }

  if (loadoutBuilder.selectedMapId != null && typeof loadoutBuilder.selectedMapId !== "string") {
    return { ok: false, message: "Loadout builder selectedMapId must be a string." };
  }

  if (!isObject(loadoutBuilder.placementsByMap)) {
    return { ok: false, message: "Loadout builder placements must be an object." };
  }

  const statsLoadout = payload.sections.statsLoadout;
  if (statsLoadout !== undefined && !isObject(statsLoadout)) {
    return { ok: false, message: "Stats loadout data must be an object when provided." };
  }

  const mapLoadout = payload.sections.mapLoadout;
  if (mapLoadout !== undefined && !isObject(mapLoadout)) {
    return { ok: false, message: "Map loadout data must be an object when provided." };
  }

  return { ok: true };
}

export function applyAppSavePayload(payload, storage = localStorage) {
  const validation = validateAppSavePayload(payload);
  if (!validation.ok) {
    return validation;
  }

  const loadoutBuilder = payload.sections.loadoutBuilder;
  storage.setItem(LOADOUT_BUILDER_SELECTED_MAP_STORAGE_KEY, loadoutBuilder.selectedMapId ?? "");
  storage.setItem(LOADOUT_BUILDER_PLACEMENTS_STORAGE_KEY, JSON.stringify(loadoutBuilder.placementsByMap ?? {}));

  const statsLoadout = payload.sections.statsLoadout === undefined
    ? normalizeStatsLoadoutState({})
    : normalizeStatsLoadoutState(payload.sections.statsLoadout);
  writeStatsLoadoutState(statsLoadout, storage);

  const mapLoadout = payload.sections.mapLoadout === undefined
    ? normalizeMapLoadoutState({})
    : normalizeMapLoadoutState(payload.sections.mapLoadout);
  writeMapLoadoutState(mapLoadout, storage);

  return { ok: true };
}