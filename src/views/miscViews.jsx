import { useMemo, useState } from "react";
import { getWeeklyBonusEvents, formatEventDate, ALL_BONUS_EVENT_DEFS } from "../lib/weeklyBonusEvents";
import { COMMUNITY_EVENT_ITEMS, getCommunityEventsInRange } from "../lib/communityEvents";
import { IMMORTAL_BOSS_ITEMS, getImmortalBossEventsInRange, getLeagueRows } from "../lib/immortalBossSchedule";

import challengesData from "../data/challenges.json";
import playerBgData from "../data/player_backgrounds.json";
import playerIconsData from "../data/player_icons.json";
import STAT_UNITS from "../data/stat_units.json";
import wavePerksData from "../data/wave_perks.json";

const REWARD_UNIT_SYMBOL = Object.fromEntries(
  Object.values(STAT_UNITS).map((value) => [value.label.toLowerCase(), value.unit])
);

function rewardUnitSym(rewardUnit) {
  return REWARD_UNIT_SYMBOL[rewardUnit?.toLowerCase()] ?? "";
}

function bannerStyle(colors) {
  return {
    background: `linear-gradient(180deg, #3a6eb0 0%, ${colors.bannerBg} 100%)`,
    border: "1px solid #4a7ec0",
    borderRadius: 8,
    padding: "8px 20px",
    marginBottom: 14,
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  };
}

export function ChallengesView({ colors, getIconUrl }) {
  const sectionBanner = bannerStyle(colors);

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <img src={getIconUrl("_starBlue.png")} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <div style={{ fontSize: 22, fontWeight: 900, color: colors.accent, letterSpacing: "0.04em", textTransform: "uppercase" }}>Challenges</div>
      </div>
      {Object.entries(challengesData.groups).map(([groupName, items]) => (
        <div key={groupName} style={{ marginBottom: 32 }}>
          <div style={sectionBanner}>
            <span style={{ fontSize: 14, fontWeight: 800, color: colors.bannerText, letterSpacing: "0.12em", textTransform: "uppercase", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{groupName}</span>
          </div>
          <div className="card-grid">
            {items.map((item) => (
              <div key={item.id} style={{ background: `linear-gradient(180deg, #2a5c96 0%, ${colors.header} 100%)`, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, background: item.bgColor, border: `2px solid ${item.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={getIconUrl(item.icon)} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: colors.text, fontWeight: 700, fontSize: 15, lineHeight: 1.2, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: colors.muted, marginBottom: 2 }}>
                    Req <span style={{ color: colors.gold, fontWeight: 700 }}>{item.requirement.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 13, color: colors.muted }}>
                    Reward <span style={{ color: item.reward < 0 ? colors.positive : colors.accent, fontWeight: 700 }}>{item.reward > 0 ? "+" : ""}{item.reward}{rewardUnitSym(item.rewardUnit)}</span> {item.rewardUnit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlayerIconsView({ colors, getIconUrl, fmt }) {
  const sectionBanner = bannerStyle(colors);

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <img src={getIconUrl("icon_inforound.png")} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <div style={{ fontSize: 22, fontWeight: 900, color: colors.accent, letterSpacing: "0.04em", textTransform: "uppercase" }}>Player Icons</div>
      </div>
      {Object.entries(playerIconsData.groups).map(([groupName, items]) => (
        <div key={groupName} style={{ marginBottom: 32 }}>
          <div style={sectionBanner}>
            <span style={{ fontSize: 14, fontWeight: 800, color: colors.bannerText, letterSpacing: "0.12em", textTransform: "uppercase", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{groupName}</span>
          </div>
          <div className="card-grid">
            {items.map((item) => (
              <div key={item.id} style={{ background: `linear-gradient(180deg, #2a5c96 0%, ${colors.header} 100%)`, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", display: "flex", gap: 12, alignItems: "center" }}>
                {item.rewardIcon ? (
                  <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, background: item.rewardBgColor, border: `2px solid ${item.rewardBorderColor}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <img src={getIconUrl(item.rewardIcon)} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
                  </div>
                ) : (
                  <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, background: colors.panel, border: `2px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: colors.muted, fontSize: 18 }}>-</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: colors.text, fontWeight: 700, fontSize: 15, lineHeight: 1.2, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: colors.muted, marginBottom: 2 }}>
                    Cost <span style={{ color: item.cost === 0 ? colors.positive : colors.gold, fontWeight: 700 }}>{item.cost === 0 ? "Free" : fmt(item.cost)}</span>
                  </div>
                  {item.rewardUnit && (
                    <div style={{ fontSize: 13, color: colors.muted }}>
                      Reward <span style={{ color: item.reward < 0 ? colors.positive : colors.accent, fontWeight: 700 }}>{item.reward > 0 ? "+" : ""}{item.reward}{rewardUnitSym(item.rewardUnit)}</span> {item.rewardUnit}
                    </div>
                  )}
                </div>
                <img src={getIconUrl(item.icon)} alt={item.name} style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 6, objectFit: "contain" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlayerBackgroundsView({ colors, getIconUrl }) {
  const sectionBanner = bannerStyle(colors);

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <img src={getIconUrl("_prestigeBg.png")} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <div style={{ fontSize: 22, fontWeight: 900, color: colors.accent, letterSpacing: "0.04em", textTransform: "uppercase" }}>Player Backgrounds</div>
      </div>
      {Object.entries(playerBgData.groups).map(([groupName, items]) => (
        <div key={groupName} style={{ marginBottom: 32 }}>
          <div style={sectionBanner}>
            <span style={{ fontSize: 14, fontWeight: 800, color: colors.bannerText, letterSpacing: "0.12em", textTransform: "uppercase", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{groupName}</span>
          </div>
          <div className="card-grid">
            {items.map((item) => (
              <div key={item.id} style={{ position: "relative", backgroundImage: item.background ? `url(${getIconUrl(item.background)})` : "none", backgroundSize: "cover", backgroundPosition: "center", border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", overflow: "hidden" }}>
                {item.background && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />}
                <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 12, alignItems: "center" }}>
                  {item.icon ? (
                    <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, background: item.bgColor, border: `2px solid ${item.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      <img src={getIconUrl(item.icon)} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, background: colors.panel, border: `2px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: colors.muted, fontSize: 18 }}>-</span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: colors.text, fontWeight: 700, fontSize: 15, lineHeight: 1.2, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: colors.muted, marginBottom: 2 }}>
                      Req <span style={{ color: colors.gold, fontWeight: 700 }}>{item.requirement != null ? (typeof item.requirement === "string" ? item.requirement : item.requirement.toLocaleString()) : "-"}</span>
                    </div>
                    {item.rewardUnit && (
                      <div style={{ fontSize: 13, color: colors.muted }}>
                        Reward <span style={{ color: item.reward < 0 ? colors.positive : colors.accent, fontWeight: 700 }}>{item.reward > 0 ? "+" : ""}{item.reward}{rewardUnitSym(item.rewardUnit)}</span> {item.rewardUnit}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WavePerkModal({ item, multiplier, onClose, colors, getIconUrl }) {
  const thStyle = {
    padding: "8px 16px",
    color: colors.muted,
    fontWeight: 700,
    fontSize: 12,
    textAlign: "left",
    borderBottom: `1px solid ${colors.border}`,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  };
  const hasBoost = multiplier > 1.0001;
  const effectiveAmt = item.statAmt * multiplier;

  const rows = useMemo(() => {
    const output = [];
    for (let stacks = 1; stacks <= item.maxStacks; stacks += 1) {
      output.push({ stacks, perStack: effectiveAmt, total: effectiveAmt * stacks });
    }
    return output;
  }, [effectiveAmt, item]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div className="modal-box" style={{ background: colors.bg, border: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 8, background: item.bgColor, border: `2px solid ${item.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={getIconUrl(item.icon)} alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: colors.text }}>{item.name}</div>
              <div style={{ fontSize: 13, color: colors.positive, marginTop: 2 }}>
                {effectiveAmt.toFixed(2)} per stack
                {hasBoost && <span style={{ color: colors.muted }}> (base {item.statAmt})</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: colors.muted, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>x</button>
        </div>

        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.border}`, display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Max Stacks</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{item.maxStacks}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Max Total</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.gold }}>{(effectiveAmt * item.maxStacks).toFixed(2)}</div>
          </div>
          {hasBoost && (
            <div>
              <div style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Effect Multiplier</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.accent }}>{multiplier.toFixed(4)}x</div>
            </div>
          )}
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ position: "sticky", top: 0, background: colors.panel }}>
              <tr>
                <th style={thStyle}>Stacks</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Per Stack</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.stacks} style={{ background: index % 2 === 0 ? "transparent" : `${colors.panel}60`, borderBottom: `1px solid ${colors.border}22` }}>
                  <td style={{ padding: "7px 16px", color: colors.accent, fontWeight: 600 }}>{row.stacks}</td>
                  <td style={{ padding: "7px 16px", color: colors.text, textAlign: "right" }}>{row.perStack.toFixed(2)}</td>
                  <td style={{ padding: "7px 16px", color: colors.gold, fontWeight: 600, textAlign: "right" }}>{row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const WAVE_PERK_EFFECT_SOURCES = [
  { key: "runes", label: "Runes", statAmt: 2, maxLevel: 10, icon: "_rune_2.png" },
  { key: "mastery", label: "Mastery", statAmt: 5, maxLevel: 5, icon: "_mastery_2.png" },
  { key: "tickets", label: "Tickets", statAmt: 2, maxLevel: 10, icon: "_ticket.png" },
  { key: "tournament", label: "Tournament", statAmt: 2, maxLevel: 10, icon: "_tournPts.png" },
];

const SNOW_FORT_WPE = { baseAmt: 3, statAmt: 1, maxLevel: 5 };

export function WavePerksView({ colors, getIconUrl, isMobile, rarityColors, mapPerkUpgradeSources }) {
  const [selectedPerk, setSelectedPerk] = useState(null);
  const [levels, setLevels] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("wavePerkEffectLevels"));
      if (saved && typeof saved === "object") {
        const defaults = Object.fromEntries(WAVE_PERK_EFFECT_SOURCES.map((source) => [source.key, ""]));
        return { ...defaults, ...saved };
      }
    } catch {}
    return Object.fromEntries(WAVE_PERK_EFFECT_SOURCES.map((source) => [source.key, ""]));
  });
  const [snowLevel, setSnowLevel] = useState(() => {
    try {
      return localStorage.getItem("wavePerkSnowLevel") ?? "";
    } catch {
      return "";
    }
  });
  const [mpLevels, setMpLevels] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mapPerkUpgrades"));
      if (saved && typeof saved === "object") {
        return { runes: "", mastery: "", ultimus: "", ...saved };
      }
    } catch {}
    return { runes: "", mastery: "", ultimus: "" };
  });

  function setLevel(key, value) {
    setLevels((previous) => {
      const next = { ...previous, [key]: value };
      localStorage.setItem("wavePerkEffectLevels", JSON.stringify(next));
      return next;
    });
  }

  function setMpLevel(id, value) {
    setMpLevels((previous) => {
      const next = { ...previous, [id]: value };
      localStorage.setItem("mapPerkUpgrades", JSON.stringify(next));
      return next;
    });
  }

  function updateSnowLevel(value) {
    setSnowLevel(value);
    localStorage.setItem("wavePerkSnowLevel", value);
  }

  function isOverMax(key) {
    const source = WAVE_PERK_EFFECT_SOURCES.find((item) => item.key === key);
    const number = parseInt(levels[key], 10);
    return !Number.isNaN(number) && levels[key] !== "" && number > source.maxLevel;
  }

  function isMpOverMax(id) {
    const source = mapPerkUpgradeSources.find((item) => item.id === id);
    const number = parseInt(mpLevels[id], 10);
    return !Number.isNaN(number) && mpLevels[id] !== "" && number > source.maxLevel;
  }

  function setAllMax() {
    const next = Object.fromEntries(WAVE_PERK_EFFECT_SOURCES.map((source) => [source.key, String(source.maxLevel)]));
    localStorage.setItem("wavePerkEffectLevels", JSON.stringify(next));
    setLevels(next);
    updateSnowLevel(String(SNOW_FORT_WPE.maxLevel));
  }

  function clearAll() {
    const next = Object.fromEntries(WAVE_PERK_EFFECT_SOURCES.map((source) => [source.key, ""]));
    localStorage.setItem("wavePerkEffectLevels", JSON.stringify(next));
    setLevels(next);
    updateSnowLevel("");
  }

  const mapPerkMult = mapPerkUpgradeSources.reduce((accumulator, upgrade) => {
    const level = Math.min(Math.max(0, parseInt(mpLevels[upgrade.id], 10) || 0), upgrade.maxLevel);
    return accumulator * (1 + (upgrade.statAmt * level) / 100);
  }, 1);

  const snowLv = Math.min(Math.max(0, parseInt(snowLevel, 10) || 0), SNOW_FORT_WPE.maxLevel);
  const snowRaw = snowLv > 0 ? (SNOW_FORT_WPE.baseAmt + SNOW_FORT_WPE.statAmt * snowLv) / 100 : 0;
  const snowBonus = snowRaw * mapPerkMult;
  const snowOverMax = snowLevel !== "" && parseInt(snowLevel, 10) > SNOW_FORT_WPE.maxLevel;

  const multiplier = WAVE_PERK_EFFECT_SOURCES.reduce((accumulator, source) => {
    const level = Math.min(Math.max(0, parseInt(levels[source.key], 10) || 0), source.maxLevel);
    return accumulator * (1 + (level * source.statAmt) / 100);
  }, 1) * (1 + snowBonus);
  const bonusPct = (multiplier - 1) * 100;
  const hasBoost = multiplier > 1.0001;

  const smallInput = {
    background: "#0f2640",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.text,
    padding: "5px 8px",
    fontSize: 13,
    fontFamily: "inherit",
    width: 68,
    textAlign: "center",
    outline: "none",
  };

  function perkBannerStyle(rarity) {
    const rarityColor = rarityColors[rarity] ?? rarityColors.Common;
    return {
      background: `linear-gradient(180deg, ${rarityColor.bg}cc 0%, ${rarityColor.bg}88 100%)`,
      border: `1px solid ${rarityColor.border}`,
      borderRadius: 8,
      padding: "8px 20px",
      marginBottom: 14,
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
    };
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <img src={getIconUrl("flagSword.png")} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <div style={{ fontSize: 22, fontWeight: 900, color: colors.accent, letterSpacing: "0.04em", textTransform: "uppercase" }}>Wave Perks</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
        <div style={{ minWidth: isMobile ? "100%" : 320 }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>Wave Perk Effect</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={setAllMax} style={{ background: `${colors.accent}22`, border: `1px solid ${colors.accent}44`, color: colors.accent, borderRadius: 6, padding: "2px 12px", fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Max</button>
                <button onClick={clearAll} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.muted, borderRadius: 6, padding: "2px 12px", fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Clear</button>
              </div>
            </div>

            {WAVE_PERK_EFFECT_SOURCES.map((source) => {
              const over = isOverMax(source.key);
              const level = Math.min(Math.max(0, parseInt(levels[source.key], 10) || 0), source.maxLevel);
              const pct = source.statAmt * level;
              return (
                <div key={source.key} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src={getIconUrl(source.icon)} alt="" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: colors.muted, minWidth: 80 }}>{source.label}</span>
                    <input type="number" min={0} max={source.maxLevel} value={levels[source.key]} onChange={(event) => setLevel(source.key, event.target.value)} style={{ ...smallInput, border: `1px solid ${over ? "#e05555" : colors.border}`, color: over ? "#e05555" : colors.text }} />
                    <span style={{ fontSize: 12, color: colors.muted }}>/ {source.maxLevel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: pct > 0 ? colors.positive : colors.muted, marginLeft: "auto" }}>+{pct}%</span>
                  </div>
                  {over && <div style={{ fontSize: 11, color: "#e05555", marginTop: 3, paddingLeft: 26 }}>Max is {source.maxLevel}</div>}
                </div>
              );
            })}

            <div style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: colors.muted, minWidth: 80, display: "flex", alignItems: "center", gap: 4 }}>
                  <img src={getIconUrl("icon_snow.png")} alt="" style={{ width: 13, height: 13, objectFit: "contain" }} />
                  Snow Fort
                </span>
                <input type="number" min={0} max={SNOW_FORT_WPE.maxLevel} value={snowLevel} onChange={(event) => updateSnowLevel(event.target.value)} style={{ ...smallInput, border: `1px solid ${snowOverMax ? "#e05555" : colors.border}`, color: snowOverMax ? "#e05555" : colors.text }} />
                <span style={{ fontSize: 12, color: colors.muted }}>/ {SNOW_FORT_WPE.maxLevel}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: snowLv > 0 ? colors.positive : colors.muted, marginLeft: "auto" }}>{snowLv > 0 ? `+${(snowBonus * 100).toFixed(2)}%` : "-"}</span>
              </div>
              {snowOverMax && <div style={{ fontSize: 11, color: "#e05555", marginTop: 3, paddingLeft: 88 }}>Max is {SNOW_FORT_WPE.maxLevel}</div>}
              {mapPerkMult > 1.0001 && snowLv > 0 && (
                <div style={{ fontSize: 11, color: colors.muted, marginTop: 2, paddingLeft: 88 }}>
                  base +{(snowRaw * 100).toFixed(0)}% x{mapPerkMult.toFixed(2)} map perk mult
                </div>
              )}
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}44`, marginTop: 6, paddingTop: 6 }}>
              <span style={{ fontSize: 13, color: colors.muted }}>Total bonus: </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: hasBoost ? colors.positive : colors.muted }}>+{bonusPct.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div style={{ minWidth: isMobile ? "100%" : 280 }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <img src={getIconUrl("Icon_Map_0.png")} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>Map Perk Upgrades</span>
              <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                <button onClick={() => {
                  const next = Object.fromEntries(mapPerkUpgradeSources.map((upgrade) => [upgrade.id, String(upgrade.maxLevel)]));
                  setMpLevels(next);
                  localStorage.setItem("mapPerkUpgrades", JSON.stringify(next));
                }} style={{ background: `${colors.accent}22`, border: `1px solid ${colors.accent}44`, color: colors.accent, borderRadius: 6, padding: "2px 12px", fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Max</button>
                <button onClick={() => {
                  const next = Object.fromEntries(mapPerkUpgradeSources.map((upgrade) => [upgrade.id, ""]));
                  setMpLevels(next);
                  localStorage.setItem("mapPerkUpgrades", JSON.stringify(next));
                }} style={{ background: "transparent", border: `1px solid ${colors.border}`, color: colors.muted, borderRadius: 6, padding: "2px 12px", fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Clear</button>
              </div>
            </div>

            {mapPerkUpgradeSources.map((upgrade) => {
              const over = isMpOverMax(upgrade.id);
              const level = Math.min(Math.max(0, parseInt(mpLevels[upgrade.id], 10) || 0), upgrade.maxLevel);
              const pct = upgrade.statAmt * level;
              return (
                <div key={upgrade.id} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src={getIconUrl(upgrade.icon)} alt="" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: colors.muted, minWidth: 80 }}>{upgrade.label}</span>
                    <input type="number" min={0} max={upgrade.maxLevel} value={mpLevels[upgrade.id]} onChange={(event) => setMpLevel(upgrade.id, event.target.value)} style={{ ...smallInput, border: `1px solid ${over ? "#e05555" : colors.border}`, color: over ? "#e05555" : colors.text }} />
                    <span style={{ fontSize: 12, color: colors.muted }}>/ {upgrade.maxLevel}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: pct > 0 ? colors.positive : colors.muted, marginLeft: "auto" }}>+{pct}%</span>
                  </div>
                  {over && <div style={{ fontSize: 11, color: "#e05555", marginTop: 3, paddingLeft: 26 }}>Max is {upgrade.maxLevel}</div>}
                </div>
              );
            })}

            <div style={{ borderTop: `1px solid ${colors.border}44`, marginTop: 6, paddingTop: 6 }}>
              <span style={{ fontSize: 13, color: colors.muted }}>Map perk multiplier: </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: mapPerkMult > 1.0001 ? colors.positive : colors.muted }}>{mapPerkMult.toFixed(4)}x</span>
            </div>
          </div>
        </div>
      </div>

      {wavePerksData.note && (
        <div style={{ fontSize: 13, color: colors.muted, marginBottom: 20, padding: "8px 12px", background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 6 }}>
          {wavePerksData.note}
        </div>
      )}

      {Object.entries(wavePerksData.groups).map(([groupName, items]) => {
        const rarityColor = rarityColors[groupName] ?? rarityColors.Common;
        return (
          <div key={groupName} style={{ marginBottom: 32 }}>
            <div style={perkBannerStyle(groupName)}>
              <span style={{ fontSize: 14, fontWeight: 800, color: rarityColor.text, letterSpacing: "0.12em", textTransform: "uppercase", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{groupName}</span>
            </div>
            <div className="card-grid">
              {items.map((item) => (
                <div key={item.id} onClick={() => setSelectedPerk(item)} style={{ background: `linear-gradient(180deg, #2a5c96 0%, ${colors.header} 100%)`, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
                  <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 8, background: item.bgColor, border: `2px solid ${item.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <img src={getIconUrl(item.icon)} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: colors.text, fontWeight: 700, fontSize: 15, lineHeight: 1.2, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: colors.muted, marginBottom: 2 }}>
                      Per stack <span style={{ color: item.statAmt < 0 ? colors.positive : colors.accent, fontWeight: 700 }}>{(item.statAmt * multiplier).toFixed(2)}</span>
                      {hasBoost && <span style={{ fontSize: 11, color: colors.muted }}> (base {item.statAmt})</span>}
                    </div>
                    <div style={{ fontSize: 13, color: colors.muted }}>
                      Max stacks <span style={{ color: colors.gold, fontWeight: 700 }}>{item.maxStacks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {selectedPerk && <WavePerkModal item={selectedPerk} multiplier={multiplier} onClose={() => setSelectedPerk(null)} colors={colors} getIconUrl={getIconUrl} />}
    </div>
  );
}

function msToDateValue(ms) {
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dateValueToMs(value) {
  const [yyyy, mm, dd] = value.split("-").map(Number);
  return Date.UTC(yyyy, mm - 1, dd);
}

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "Any Day" },
  { value: "wednesday", label: "Wednesday" },
  { value: "weekend", label: "Weekend" },
];

function BonusEventLabel({ bonuses, mutedColor }) {
  const sep = mutedColor ?? "#8aa3c0";
  return (
    <span>
      {bonuses.map((bonus, i) => (
        <span key={bonus.label}>
          {i > 0 && <span style={{ color: sep }}> & </span>}
          <span style={{ color: bonus.color }}>{bonus.label.replace(/ Bonus$/, "")}</span>
        </span>
      ))}
    </span>
  );
}

export function WeeklyEventsView({ colors }) {
  const nowMs = Date.now();
  const todayMs = Date.UTC(
    new Date(nowMs).getUTCFullYear(),
    new Date(nowMs).getUTCMonth(),
    new Date(nowMs).getUTCDate()
  );

  const [startValue, setStartValue] = useState(() => msToDateValue(todayMs));
  const [endValue, setEndValue] = useState(() => msToDateValue(todayMs + 90 * 86400000));
  const [typeFilter, setTypeFilter] = useState("all");
  const [eventKeyFilter, setEventKeyFilter] = useState("all");

  const events = useMemo(() => {
    const startMs = dateValueToMs(startValue);
    const endMs = dateValueToMs(endValue) + 86400000;
    let all = getWeeklyBonusEvents(startMs, endMs);
    if (typeFilter !== "all") all = all.filter((ev) => ev.type === typeFilter);
    if (eventKeyFilter !== "all") all = all.filter((ev) => ev.key === eventKeyFilter);
    return all;
  }, [startValue, endValue, typeFilter, eventKeyFilter]);

  const inputStyle = {
    background: colors?.panel ?? "#0d1b2a",
    border: `1px solid ${colors?.border ?? "#1e3a5f"}`,
    borderRadius: 8,
    color: colors?.text ?? "#e8eaf0",
    padding: "6px 10px",
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
  };

  const selectWrapStyle = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
  };

  const selectStyle = {
    ...inputStyle,
    paddingRight: 28,
    appearance: "none",
    backgroundImage: "none",
  };

  const chevronStyle = {
    position: "absolute",
    right: 8,
    pointerEvents: "none",
    color: colors?.muted ?? "#8aa3c0",
    fontSize: 10,
    lineHeight: 1,
  };

  const typeColors = {
    wednesday: "#f5a623",
    weekend: "#7d7cff",
  };

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: colors?.accent ?? "#4a9eff", letterSpacing: "0.04em", textTransform: "uppercase" }}>Events</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>From</span>
          <input
            type="date"
            value={startValue}
            onChange={(e) => setStartValue(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>To</span>
          <input
            type="date"
            value={endValue}
            onChange={(e) => setEndValue(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>Occurs On</span>
          <div style={selectWrapStyle}>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
              {TYPE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={chevronStyle}>&#9660;</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>Event Type</span>
          <div style={selectWrapStyle}>
            <select value={eventKeyFilter} onChange={(e) => setEventKeyFilter(e.target.value)} style={selectStyle}>
              <option value="all">All</option>
              {Array.from(new Map(ALL_BONUS_EVENT_DEFS.map((e) => [e.key, e])).values()).map((e) => (
                <option key={e.key} value={e.key}>{e.label}</option>
              ))}
            </select>
            <span style={chevronStyle}>&#9660;</span>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ color: colors?.muted ?? "#8aa3c0", fontSize: 14, padding: "20px 0" }}>No events in the selected range.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 160px) 1fr", gap: "2px 0" }}>
          {events.map((ev) => {
            const typeColor = typeColors[ev.type] ?? ev.accentColor;
            const startLabel = formatEventDate(ev.startMs);
            const endLabel = ev.type === "weekend" ? ` \u2013 ${formatEventDate(ev.endMs - 1)}` : "";
            const dateLabel = `${startLabel}${endLabel}`;
            const cellBase = {
              borderTop: `1px solid ${colors?.border ?? "#1e3a5f"}44`,
              padding: "12px 14px",
              background: `${ev.accentColor}0a`,
            };
            return [
              <div
                key={`${ev.instanceKey}-date`}
                style={{
                  ...cellBase,
                  borderLeft: `3px solid ${ev.accentColor}`,
                  borderRadius: "10px 0 0 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: typeColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {ev.type === "wednesday" ? "Wednesday" : "Weekend"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors?.text ?? "#e8eaf0", lineHeight: 1.3 }}>{dateLabel}</div>
              </div>,
              <div
                key={`${ev.instanceKey}-detail`}
                style={{
                  ...cellBase,
                  borderRadius: "0 10px 10px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800 }}><BonusEventLabel bonuses={ev.bonuses} mutedColor={colors?.muted} /></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
                  {ev.bonuses.map((bonus) => (
                    <div key={bonus.label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0" }}>{bonus.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: bonus.color ?? colors?.text ?? "#e8eaf0" }}>{bonus.value}</span>
                    </div>
                  ))}
                </div>
              </div>,
            ];
          })}
        </div>
      )}
    </div>
  );
}

const IMMORTAL_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  ...IMMORTAL_BOSS_ITEMS.map((item) => ({ value: item.key, label: item.label })),
];

export function ImmortalScheduleView({ colors }) {
  const nowMs = Date.now();
  const todayMs = Date.UTC(
    new Date(nowMs).getUTCFullYear(),
    new Date(nowMs).getUTCMonth(),
    new Date(nowMs).getUTCDate()
  );

  const [startValue, setStartValue] = useState(() => msToDateValue(todayMs));
  const [endValue, setEndValue] = useState(() => msToDateValue(todayMs + 84 * 86400000));
  const [typeFilter, setTypeFilter] = useState("all");

  const events = useMemo(() => {
    const startMs = dateValueToMs(startValue);
    const endMs = dateValueToMs(endValue) + 86400000;
    const all = getImmortalBossEventsInRange(startMs, endMs);
    if (typeFilter === "all") return all;
    return all.filter((ev) => ev.key === typeFilter);
  }, [startValue, endValue, typeFilter]);

  const inputStyle = {
    background: colors?.panel ?? "#0d1b2a",
    border: `1px solid ${colors?.border ?? "#1e3a5f"}`,
    borderRadius: 8,
    color: colors?.text ?? "#e8eaf0",
    padding: "6px 10px",
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
  };

  const selectWrapStyle = { position: "relative", display: "inline-flex", alignItems: "center" };
  const selectStyle = { ...inputStyle, paddingRight: 28, appearance: "none", backgroundImage: "none" };
  const chevronStyle = { position: "absolute", right: 8, pointerEvents: "none", color: colors?.muted ?? "#8aa3c0", fontSize: 10, lineHeight: 1 };

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: colors?.accent ?? "#4a9eff", letterSpacing: "0.04em", textTransform: "uppercase" }}>Immortal Schedule</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>From</span>
          <input type="date" value={startValue} onChange={(e) => setStartValue(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>To</span>
          <input type="date" value={endValue} onChange={(e) => setEndValue(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>Immortal Type</span>
          <div style={selectWrapStyle}>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
              {IMMORTAL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={chevronStyle}>&#9660;</span>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ color: colors?.muted ?? "#8aa3c0", fontSize: 14, padding: "20px 0" }}>No events in the selected range.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 150px) 1fr", gap: "2px 0" }}>
          {events.map((ev) => {
            const leagueRows = getLeagueRows(ev.key);
            const cellBase = {
              borderTop: `1px solid ${colors?.border ?? "#1e3a5f"}44`,
              padding: "12px 14px",
              background: `${ev.accentColor}0a`,
            };
            return [
              <div
                key={`${ev.instanceKey}-date`}
                style={{
                  ...cellBase,
                  borderLeft: `3px solid ${ev.accentColor}`,
                  borderRadius: "10px 0 0 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: ev.accentColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>{ev.day}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors?.text ?? "#e8eaf0" }}>{formatEventDate(ev.startMs)}</div>
              </div>,
              <div
                key={`${ev.instanceKey}-detail`}
                style={{
                  ...cellBase,
                  borderRadius: "0 10px 10px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: ev.accentColor }}>{ev.label}</div>
                <div style={{ display: "grid", gap: 4 }}>
                  {leagueRows.map((row) => (
                    <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: row.color, flexShrink: 0, minWidth: 80 }}>{row.name}</span>
                      <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0" }}>{row.note}</span>
                    </div>
                  ))}
                </div>
              </div>,
            ];
          })}
        </div>
      )}
    </div>
  );
}

const COMMUNITY_EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Events" },
  ...COMMUNITY_EVENT_ITEMS.map((item) => ({ value: item.key, label: item.label })),
];

export function CommunityEventsView({ colors }) {
  const nowMs = Date.now();
  const todayMs = Date.UTC(
    new Date(nowMs).getUTCFullYear(),
    new Date(nowMs).getUTCMonth(),
    new Date(nowMs).getUTCDate()
  );

  const [startValue, setStartValue] = useState(() => msToDateValue(todayMs));
  const [endValue, setEndValue] = useState(() => msToDateValue(todayMs + 84 * 86400000)); // 12 weeks
  const [eventKeyFilter, setEventKeyFilter] = useState("all");

  const events = useMemo(() => {
    const startMs = dateValueToMs(startValue);
    const endMs = dateValueToMs(endValue) + 86400000;
    const all = getCommunityEventsInRange(startMs, endMs);
    if (eventKeyFilter === "all") return all;
    return all.filter((ev) => ev.key === eventKeyFilter);
  }, [startValue, endValue, eventKeyFilter]);

  const inputStyle = {
    background: colors?.panel ?? "#0d1b2a",
    border: `1px solid ${colors?.border ?? "#1e3a5f"}`,
    borderRadius: 8,
    color: colors?.text ?? "#e8eaf0",
    padding: "6px 10px",
    fontSize: 13,
    fontFamily: "inherit",
    cursor: "pointer",
  };

  const selectWrapStyle = { position: "relative", display: "inline-flex", alignItems: "center" };
  const selectStyle = { ...inputStyle, paddingRight: 28, appearance: "none", backgroundImage: "none" };
  const chevronStyle = { position: "absolute", right: 8, pointerEvents: "none", color: colors?.muted ?? "#8aa3c0", fontSize: 10, lineHeight: 1 };

  return (
    <div>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: colors?.accent ?? "#4a9eff", letterSpacing: "0.04em", textTransform: "uppercase" }}>Community Events</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>From</span>
          <input type="date" value={startValue} onChange={(e) => setStartValue(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>To</span>
          <input type="date" value={endValue} onChange={(e) => setEndValue(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", fontWeight: 600 }}>Event Type</span>
          <div style={selectWrapStyle}>
            <select value={eventKeyFilter} onChange={(e) => setEventKeyFilter(e.target.value)} style={selectStyle}>
              {COMMUNITY_EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={chevronStyle}>&#9660;</span>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ color: colors?.muted ?? "#8aa3c0", fontSize: 14, padding: "20px 0" }}>No events in the selected range.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 180px) 1fr", gap: "2px 0" }}>
          {events.map((ev) => {
            const startLabel = formatEventDate(ev.startMs);
            const endLabel = formatEventDate(ev.endMs - 1);
            const cellBase = {
              borderTop: `1px solid ${colors?.border ?? "#1e3a5f"}44`,
              padding: "12px 14px",
              background: `${ev.accentColor}0a`,
            };
            return [
              <div
                key={`${ev.instanceKey}-date`}
                style={{
                  ...cellBase,
                  borderLeft: `3px solid ${ev.accentColor}`,
                  borderRadius: "10px 0 0 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: ev.accentColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>Weekly</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors?.text ?? "#e8eaf0", lineHeight: 1.3 }}>{startLabel}</div>
                <div style={{ fontSize: 11, color: colors?.muted ?? "#8aa3c0" }}>{`\u2013 ${endLabel}`}</div>
              </div>,
              <div
                key={`${ev.instanceKey}-detail`}
                style={{
                  ...cellBase,
                  borderRadius: "0 10px 10px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: ev.accentColor }}>{ev.label}</div>
                <div style={{ fontSize: 12, color: colors?.muted ?? "#8aa3c0", lineHeight: 1.5 }}>{ev.goal}</div>
              </div>,
            ];
          })}
        </div>
      )}
    </div>
  );
}