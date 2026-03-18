export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function roundCoord(value, precision = 3) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function clampCoord(value, precision = 3) {
  return clamp(roundCoord(Number(value) || 0, precision), 0, 1);
}

export function isNormalizedCoord(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function normalizedToPixels(x, y, width, height) {
  return {
    x: clamp(Number(x) || 0, 0, 1) * width,
    y: clamp(Number(y) || 0, 0, 1) * height,
  };
}

export function pixelsToNormalized(px, py, width, height, precision = 3) {
  return {
    x: width > 0 ? clampCoord(px / width, precision) : 0,
    y: height > 0 ? clampCoord(py / height, precision) : 0,
  };
}

export function toPercent(value) {
  return `${clamp(Number(value) || 0, 0, 1) * 100}%`;
}

export function sliderToCoord(value, precision = 3) {
  return clampCoord((Number(value) || 0) / 1000, precision);
}

export function coordToSlider(value) {
  return Math.round(clamp(Number(value) || 0, 0, 1) * 1000);
}