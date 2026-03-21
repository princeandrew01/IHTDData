import { MAPS_JSON_PATH, updateMapsJsonContent } from "./prompt-generation";

export function supportsFileSystemAccess() {
  return typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";
}

function buildPickerOptions() {
  return {
    excludeAcceptAllOption: false,
    multiple: false,
    suggestedName: "maps.json",
    types: [
      {
        description: "JSON files",
        accept: {
          "application/json": [".json"],
        },
      },
    ],
  };
}

export async function pickMapsJsonHandle() {
  if (!supportsFileSystemAccess()) {
    throw new Error("This browser does not support direct file write access. Use the download fallback instead.");
  }

  const [handle] = await window.showOpenFilePicker(buildPickerOptions());
  if (!handle) {
    throw new Error("No file was selected.");
  }

  return handle;
}

export async function readHandleText(handle) {
  const file = await handle.getFile();
  return file.text();
}

export function analyzeMapsFileSelection(handle, rawJsonText, expectedMapIds = []) {
  const warnings = [];
  const filename = handle?.name ?? "";

  if (filename && filename !== "maps.json") {
    warnings.push(`The selected file is named ${filename}, not maps.json.`);
  }

  try {
    const parsed = JSON.parse(rawJsonText);
    if (!Array.isArray(parsed?.maps)) {
      warnings.push("The selected file does not contain a top-level maps array.");
    } else if (expectedMapIds.length) {
      const fileMapIds = new Set(parsed.maps.map((map) => map?.id).filter(Boolean));
      const missingMapIds = expectedMapIds.filter((mapId) => !fileMapIds.has(mapId));
      if (missingMapIds.length) {
        warnings.push(`The selected file is missing expected map ids: ${missingMapIds.join(", ")}.`);
      }
    }
  } catch {
    warnings.push("The selected file could not be parsed for verification.");
  }

  warnings.push(`Browser file pickers do not expose the full absolute path, so ${MAPS_JSON_PATH} cannot be verified directly from the web app.`);
  return warnings;
}

export async function writeMapSpotsToHandle(handle, mapId, spots) {
  if (!handle) {
    throw new Error(`Select ${MAPS_JSON_PATH} before writing.`);
  }

  const sourceText = await readHandleText(handle);
  const nextText = updateMapsJsonContent(sourceText, mapId, spots);
  const writable = await handle.createWritable();
  await writable.write(nextText);
  await writable.close();
  return nextText;
}

export function downloadUpdatedMapsJson(rawJsonText, mapId, spots) {
  const nextText = updateMapsJsonContent(rawJsonText, mapId, spots);
  const blob = new Blob([nextText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "maps.updated.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return nextText;
}