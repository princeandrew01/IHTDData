import { useLayoutEffect, useRef, useState } from "react";
import { clamp, toPercent } from "../../lib/coords";
import { getHeroImageName, getMapImageName } from "../../lib/gameData";

function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) {
      return undefined;
    }

    const element = ref.current;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [ref]);

  return size;
}

export function MapStage({ map, colors, getIconUrl, minHeight = 320, children }) {
  const stageRef = useRef(null);
  const size = useElementSize(stageRef);
  const imageName = getMapImageName(map);
  const imageSrc = imageName ? getIconUrl(imageName) : null;

  if (!imageSrc) {
    return (
      <div style={{
        minHeight,
        borderRadius: 16,
        border: `1px dashed ${colors.border}`,
        background: colors.panel,
        color: colors.muted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}>
        {map?.name ?? "Selected map"} does not have a usable image.
      </div>
    );
  }

  const overlayMetrics = {
    width: size.width,
    height: size.height,
    tokenSize: clamp(size.width * 0.09, 36, 72),
    spotSize: clamp(size.width * 0.04, 18, 28),
    stageRef,
  };

  return (
    <div ref={stageRef} style={{
      position: "relative",
      width: "100%",
      borderRadius: 18,
      overflow: "hidden",
      border: `1px solid ${colors.border}`,
      background: `linear-gradient(180deg, ${colors.panel} 0%, #0c1d2f 100%)`,
      boxShadow: "0 18px 48px rgba(0,0,0,0.32)",
    }}>
      <img
        src={imageSrc}
        alt={map?.name ?? "Map"}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
      <div style={{ position: "absolute", inset: 0 }}>
        {children?.(overlayMetrics)}
      </div>
    </div>
  );
}

export function OverlayAnchor({ x, y, zIndex = 2, children, style, nodeRef, ...rest }) {
  return (
    <div
      ref={nodeRef}
      {...rest}
      style={{
        position: "absolute",
        left: toPercent(x),
        top: toPercent(y),
        transform: "translate(-50%, -50%)",
        zIndex,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function HeroToken({ hero, getIconUrl, colors, size, label, isGhost = false, opacity = 1 }) {
  const imageName = getHeroImageName(hero);
  const imageSrc = imageName ? getIconUrl(imageName) : null;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `2px solid ${isGhost ? `${colors.accent}aa` : colors.accent}`,
      background: isGhost ? "rgba(245,146,30,0.16)" : "radial-gradient(circle at 30% 30%, #35679c 0%, #16324f 72%, #0c1928 100%)",
      boxShadow: isGhost ? `0 0 0 2px rgba(245,146,30,0.18)` : "0 8px 18px rgba(0,0,0,0.35)",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(2px)",
      opacity,
    }}>
      {imageSrc ? (
        <img src={imageSrc} alt={label ?? hero?.name ?? "Hero"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: colors.text, fontSize: Math.max(12, size * 0.22), fontWeight: 800 }}>
          {(hero?.name ?? "?").slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function SpotBadge({ size, colors, occupied = false, active = false, highlighted = false, label }) {
  const borderColor = active ? colors.accent : occupied ? colors.positive : colors.border;
  const background = active
    ? "rgba(245,146,30,0.22)"
    : occupied
      ? "rgba(46,204,113,0.22)"
      : highlighted
        ? "rgba(122,170,207,0.24)"
        : "rgba(14,28,43,0.82)";

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `2px solid ${borderColor}`,
      background,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.text,
      fontSize: Math.max(10, size * 0.28),
      fontWeight: 800,
      boxShadow: active ? "0 0 0 4px rgba(245,146,30,0.18)" : "0 6px 12px rgba(0,0,0,0.22)",
      transition: "transform 0.15s ease, border-color 0.15s ease, background 0.15s ease",
    }}>
      {label}
    </div>
  );
}

export function GuideLines({ x, y, colors, lineColor, softColor, zIndex = 3 }) {
  const primaryColor = lineColor ?? colors.accent;
  const secondaryColor = softColor ?? "rgba(245,146,30,0.15)";

  return (
    <>
      <div style={{
        position: "absolute",
        left: toPercent(x),
        top: 0,
        bottom: 0,
        width: 2,
        transform: "translateX(-50%)",
        background: `linear-gradient(180deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        borderLeft: `1px dashed ${primaryColor}`,
        pointerEvents: "none",
        zIndex,
      }} />
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: toPercent(y),
        height: 2,
        transform: "translateY(-50%)",
        background: `linear-gradient(90deg, ${secondaryColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`,
        borderTop: `1px dashed ${primaryColor}`,
        pointerEvents: "none",
        zIndex,
      }} />
    </>
  );
}