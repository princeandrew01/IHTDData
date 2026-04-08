const MS_PER_DAY = 86400000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

// Anchor: Sat Apr 4, 2026 UTC midnight — segment 0 = "none"
export const IMMORTAL_BOSS_ANCHOR_MS = Date.UTC(2026, 3, 4);

export const IMMORTAL_BOSS_ITEMS = [
  { key: "none",  label: "No Immunity",    accentColor: "#8a8a9a" },
  { key: "melee", label: "Melee Immunity", accentColor: "#5bc8f5" },
  { key: "mage",  label: "Mage Immunity",  accentColor: "#e05555" },
  { key: "range", label: "Range Immunity", accentColor: "#2ecc71" },
];

export const IMMORTAL_BOSS_LEAGUES = [
  { id: "bronze",  name: "Bronze",        color: "#CD7F32" },
  { id: "silver",  name: "Silver / Gold", color: "#C0C0C0" },
  { id: "diamond", name: "Diamond",       color: "#40FFFF" },
];

export function getLeagueRows(bossKey) {
  if (bossKey === "none") {
    return IMMORTAL_BOSS_LEAGUES.map((l) => ({ ...l, note: "No class immunity active" }));
  }
  const cls = bossKey.charAt(0).toUpperCase() + bossKey.slice(1);
  return [
    { ...IMMORTAL_BOSS_LEAGUES[0], note: `${cls} heroes are unaffected` },
    { ...IMMORTAL_BOSS_LEAGUES[1], note: `${cls} heroes deal 50% reduced damage` },
    { ...IMMORTAL_BOSS_LEAGUES[2], note: `${cls} heroes cannot attack` },
  ];
}

function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

// Segment k: even = Saturday, odd = Tuesday
function segmentStartMs(k) {
  const week = Math.floor(k / 2);
  const isTue = positiveModulo(k, 2) === 1;
  return IMMORTAL_BOSS_ANCHOR_MS + week * MS_PER_WEEK + (isTue ? 3 * MS_PER_DAY : 0);
}

export function getImmortalBossEventsInRange(startMs, endMs) {
  const n = IMMORTAL_BOSS_ITEMS.length;
  const approxSeg = Math.max(0, Math.floor((startMs - IMMORTAL_BOSS_ANCHOR_MS) / (3.5 * MS_PER_DAY)) - 2);
  const events = [];

  for (let seg = approxSeg; ; seg++) {
    const evStart = segmentStartMs(seg);
    const evEnd = evStart + MS_PER_DAY;
    if (evStart > endMs) break;
    if (evEnd > startMs) {
      const item = IMMORTAL_BOSS_ITEMS[positiveModulo(seg, n)];
      events.push({
        instanceKey: `ib-${seg}`,
        ...item,
        startMs: evStart,
        endMs: evEnd,
        day: positiveModulo(seg, 2) === 0 ? "Saturday" : "Tuesday",
      });
    }
  }

  return events;
}
