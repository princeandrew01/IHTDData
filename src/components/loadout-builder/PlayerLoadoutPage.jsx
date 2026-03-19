import { useEffect, useMemo, useState } from "react";

import {
  getPlayerLoadoutItems,
  getPlayerLoadoutPurchasedEntries,
  PLAYER_LOADOUT_TAB_MAP,
  PLAYER_LOADOUT_TABS,
  readPlayerLoadoutState,
  writePlayerLoadoutState,
} from "../../lib/playerLoadout";
import { buildStatBreakdown, formatSignedHeroBonus } from "../../lib/loadoutStatEngine";

function TabButton({ tab, isActive, colors, getIconUrl, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.key)}
      style={{
        width: "100%",
        background: isActive ? `linear-gradient(135deg, ${colors.accent}33 0%, ${colors.header} 100%)` : colors.header,
        border: `1px solid ${isActive ? colors.accent : colors.border}`,
        borderRadius: 12,
        color: colors.text,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        textAlign: "left",
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: colors.panel, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {tab.menuIcon ? <img src={getIconUrl(tab.menuIcon)} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} /> : null}
      </div>
      <div style={{ minWidth: 0, flex: 1, fontSize: 14, fontWeight: 800, color: isActive ? colors.accent : colors.text }}>{tab.label}</div>
    </button>
  );
}

function SummaryCard({ label, value, sublabel, colors, valueColor }) {
  return (
    <div style={{ background: `linear-gradient(180deg, ${colors.header} 0%, ${colors.panel} 100%)`, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14, display: "grid", gap: 6 }}>
      <div style={{ fontSize: 11, color: colors.muted, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 22, color: valueColor ?? colors.text, fontWeight: 900 }}>{value}</div>
      {sublabel ? <div style={{ fontSize: 12, color: colors.muted }}>{sublabel}</div> : null}
    </div>
  );
}

function PurchasedToggle({ isPurchased, colors, onToggle }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, color: colors.text, fontSize: 12, fontWeight: 700 }}>
      <input type="checkbox" checked={isPurchased} onChange={(event) => onToggle(event.target.checked)} />
      Purchased
    </label>
  );
}

function RewardLine({ item, colors }) {
  if (!item.rewardUnit || item.reward == null) {
    return <div style={{ fontSize: 13, color: colors.muted }}>Reward -</div>;
  }

  return (
    <div style={{ fontSize: 13, color: colors.muted }}>
      Reward <span style={{ color: item.reward < 0 ? colors.positive : colors.accent, fontWeight: 700 }}>{formatSignedHeroBonus("damage", item.reward).replace("%", "")}</span> {item.rewardUnit}
    </div>
  );
}

function IconCard({ item, isPurchased, colors, getIconUrl, fmt, onToggle }) {
  return (
    <div style={{ background: `linear-gradient(180deg, #2a5c96 0%, ${colors.header} 100%)`, border: `1px solid ${isPurchased ? colors.accent : colors.border}`, borderRadius: 10, padding: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
          <RewardLine item={item} colors={colors} />
        </div>
        <img src={getIconUrl(item.icon)} alt={item.name} style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 6, objectFit: "contain" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: isPurchased ? colors.accent : colors.muted, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {isPurchased ? "Included In Loadout" : "Not Purchased"}
        </div>
        <PurchasedToggle isPurchased={isPurchased} colors={colors} onToggle={onToggle} />
      </div>
    </div>
  );
}

function BackgroundCard({ item, isPurchased, colors, getIconUrl, onToggle }) {
  return (
    <div style={{ position: "relative", backgroundImage: item.background ? `url(${getIconUrl(item.background)})` : "none", backgroundSize: "cover", backgroundPosition: "center", border: `1px solid ${isPurchased ? colors.accent : colors.border}`, borderRadius: 10, padding: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.2)", overflow: "hidden", minHeight: 132 }}>
      {item.background && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.58)" }} />}
      <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 12, height: "100%" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
            <RewardLine item={item} colors={colors} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: "auto" }}>
          <div style={{ fontSize: 12, color: isPurchased ? colors.accent : colors.muted, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {isPurchased ? "Included In Loadout" : "Not Purchased"}
          </div>
          <PurchasedToggle isPurchased={isPurchased} colors={colors} onToggle={onToggle} />
        </div>
      </div>
    </div>
  );
}

function StatSummaryList({ entries, colors }) {
  const breakdown = useMemo(() => buildStatBreakdown(entries), [entries]);

  if (!breakdown.orderedStats.length) {
    return <div style={{ color: colors.muted, fontSize: 13 }}>No purchased cosmetic rewards are contributing stats yet.</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {breakdown.orderedStats.map((item) => (
        <div key={item.statKey} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 13, color: colors.text, fontWeight: 800 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: colors.accent, fontWeight: 900 }}>{formatSignedHeroBonus(item.statKey, item.total)}</div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {item.entries.map((entry) => (
              <div key={`${entry.sourceType}-${entry.sourceId}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
                <span style={{ color: colors.muted }}>{entry.sourceLabel}</span>
                <span style={{ color: colors.text, fontWeight: 700 }}>{formatSignedHeroBonus(item.statKey, entry.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlayerLoadoutPage({ colors, getIconUrl, fmt }) {
  const initialState = useMemo(() => readPlayerLoadoutState(localStorage), []);
  const [selectedTab, setSelectedTab] = useState(initialState.selectedTab);
  const [purchasedByTab, setPurchasedByTab] = useState(initialState.purchasedByTab);

  useEffect(() => {
    writePlayerLoadoutState({ selectedTab, purchasedByTab }, localStorage);
  }, [selectedTab, purchasedByTab]);

  const activeTab = PLAYER_LOADOUT_TAB_MAP[selectedTab] ?? PLAYER_LOADOUT_TABS[0];
  const activeItems = getPlayerLoadoutItems(activeTab.key);
  const activePurchased = purchasedByTab[activeTab.key] ?? {};
  const activeEntries = useMemo(
    () => getPlayerLoadoutPurchasedEntries({ selectedTab: activeTab.key, purchasedByTab: { [activeTab.key]: activePurchased } }),
    [activeItems, activePurchased, activeTab.key]
  );
  const allEntries = useMemo(
    () => getPlayerLoadoutPurchasedEntries({ selectedTab, purchasedByTab }),
    [selectedTab, purchasedByTab]
  );
  const purchasedCount = Object.values(activePurchased).filter(Boolean).length;

  function handlePurchasedChange(tabKey, itemId, isPurchased) {
    setPurchasedByTab((current) => {
      const nextTab = { ...(current[tabKey] ?? {}) };
      if (isPurchased) {
        nextTab[itemId] = true;
      } else {
        delete nextTab[itemId];
      }

      return {
        ...current,
        [tabKey]: nextTab,
      };
    });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ background: `linear-gradient(180deg, ${colors.header} 0%, ${colors.panel} 100%)`, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 18, display: "grid", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: colors.text }}>Player Loadout</div>
        <div style={{ fontSize: 13, color: colors.muted, maxWidth: 780 }}>
          Track which player icons and backgrounds are purchased and apply their rewards as global loadout stats.
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "start" }}>
        <aside style={{ flex: "0 0 260px", width: "100%", maxWidth: 320, display: "grid", gap: 14, position: "sticky", top: 0 }}>
          <div style={{ background: `linear-gradient(180deg, ${colors.panel} 0%, ${colors.header} 100%)`, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16, display: "grid", gap: 8 }}>
            {PLAYER_LOADOUT_TABS.map((tab) => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={tab.key === activeTab.key}
                colors={colors}
                getIconUrl={getIconUrl}
                onSelect={setSelectedTab}
              />
            ))}
          </div>
        </aside>

        <section style={{ flex: "1 1 760px", minWidth: 0, display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <SummaryCard label="Active Tab" value={activeTab.label} colors={colors} />
            <SummaryCard label="Purchased In Tab" value={String(purchasedCount)} colors={colors} valueColor={colors.accent} />
            <SummaryCard label="Tab Stat Sources" value={String(activeEntries.length)} colors={colors} valueColor={colors.positive} />
            <SummaryCard label="Total Stat Sources" value={String(allEntries.length)} colors={colors} valueColor={colors.gold} />
          </div>

          <div style={{ background: `linear-gradient(180deg, ${colors.header} 0%, ${colors.panel} 100%)`, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16, display: "grid", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: colors.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {activeTab.label} Global Stat Summary
            </div>
            <StatSummaryList entries={activeEntries} colors={colors} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {activeItems.map((item) => {
              const isPurchased = Boolean(activePurchased[item.id]);

              if (activeTab.key === "backgrounds") {
                return (
                  <BackgroundCard
                    key={item.id}
                    item={item}
                    isPurchased={isPurchased}
                    colors={colors}
                    getIconUrl={getIconUrl}
                    onToggle={(checked) => handlePurchasedChange(activeTab.key, item.id, checked)}
                  />
                );
              }

              return (
                <IconCard
                  key={item.id}
                  item={item}
                  isPurchased={isPurchased}
                  colors={colors}
                  getIconUrl={getIconUrl}
                  fmt={fmt}
                  onToggle={(checked) => handlePurchasedChange(activeTab.key, item.id, checked)}
                />
              );
            })}
          </div>

          <div style={{ background: `linear-gradient(180deg, ${colors.header} 0%, ${colors.panel} 100%)`, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 16, display: "grid", gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: colors.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Combined Cosmetic Stat Summary
            </div>
            <StatSummaryList entries={allEntries} colors={colors} />
          </div>
        </section>
      </div>
    </div>
  );
}