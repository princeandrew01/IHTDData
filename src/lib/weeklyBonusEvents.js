const MS_PER_DAY = 86400000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

export const WED_BONUS_EVENTS = [
  {
    key: "synergy_milestone",
    label: "Synergy & Milestone Bonus",
    accentColor: "#6dde6d",
    bonuses: [
      { label: "Synergy Bonus", value: "+10%", color: "#6dde6d" },
      { label: "Milestone Bonus", value: "+25%", color: "#f5a623" },
    ],
  },
  {
    key: "energy_prestige",
    label: "Energy & Prestige Power",
    accentColor: "#2ecc71",
    bonuses: [
      { label: "Energy Income", value: "2x", color: "#2ecc71" },
      { label: "Prestige Power", value: "2x", color: "#9b59b6" },
    ],
  },
  {
    key: "skill_spell",
    label: "Skill Power & Spell Cooldown",
    accentColor: "#33cccc",
    bonuses: [
      { label: "Skill Power", value: "+3", color: "#33cccc" },
      { label: "Spell Cooldown", value: "-15%", color: "#33cccc" },
    ],
  },
];

// Order: damage → synergy → rank (avoids back-to-back synergy & milestone with the Wed cycle)
export const WEEKEND_BONUS_EVENTS = [
  {
    key: "damage_gold",
    label: "Damage & Kill Gold",
    accentColor: "#e05555",
    bonuses: [
      { label: "Damage", value: "2x", color: "#e05555" },
      { label: "Kill Gold", value: "2x", color: "#f0c040" },
    ],
  },
  {
    key: "synergy_milestone",
    label: "Synergy & Milestone Bonus",
    accentColor: "#6dde6d",
    bonuses: [
      { label: "Synergy Bonus", value: "+10%", color: "#6dde6d" },
      { label: "Milestone Bonus", value: "+25%", color: "#f5a623" },
    ],
  },
  {
    key: "rank_bp",
    label: "Rank Exp & Battlepass Exp",
    accentColor: "#3a9eff",
    bonuses: [
      { label: "Rank Exp", value: "2x", color: "#3a9eff" },
      { label: "Battlepass Exp", value: "2x", color: "#1e8449" },
    ],
  },
];

// Anchors: first known occurrence of each cycle (UTC midnight)
// Wed Apr 8, 2026 — index 0 (Synergy & Milestone)
export const WED_BONUS_ANCHOR_MS = Date.UTC(2026, 3, 8);
// Sat Apr 11, 2026 — index 0 (Damage & Kill Gold)
export const WEEKEND_BONUS_ANCHOR_MS = Date.UTC(2026, 3, 11);

function getWedState(now) {
  const elapsed = now - WED_BONUS_ANCHOR_MS;
  const week = Math.floor(elapsed / MS_PER_WEEK);
  const dayOffset = Math.floor(positiveModulo(elapsed, MS_PER_WEEK) / MS_PER_DAY);
  const isActive = elapsed >= 0 && dayOffset === 0;
  const startMs = WED_BONUS_ANCHOR_MS + week * MS_PER_WEEK;
  return { isActive, week, dayOffset, startMs, endMs: startMs + MS_PER_DAY };
}

function getWkndState(now) {
  const elapsed = now - WEEKEND_BONUS_ANCHOR_MS;
  const week = Math.floor(elapsed / MS_PER_WEEK);
  const dayOffset = Math.floor(positiveModulo(elapsed, MS_PER_WEEK) / MS_PER_DAY);
  const isActive = elapsed >= 0 && dayOffset < 2;
  const startMs = WEEKEND_BONUS_ANCHOR_MS + week * MS_PER_WEEK;
  return { isActive, week, dayOffset, startMs, endMs: startMs + 2 * MS_PER_DAY };
}

function nextWedOccurrence(now) {
  const { isActive, week, dayOffset } = getWedState(now);
  const nextWeek = (isActive || dayOffset === 0) ? week + 1 : dayOffset > 0 ? week + 1 : week;
  const startMs = WED_BONUS_ANCHOR_MS + nextWeek * MS_PER_WEEK;
  return { event: WED_BONUS_EVENTS[positiveModulo(nextWeek, WED_BONUS_EVENTS.length)], startMs, endMs: startMs + MS_PER_DAY, type: "wednesday" };
}

function nextWkndOccurrence(now) {
  const { isActive, week, dayOffset } = getWkndState(now);
  const nextWeek = (isActive || dayOffset < 2) ? week + 1 : week;
  const startMs = WEEKEND_BONUS_ANCHOR_MS + nextWeek * MS_PER_WEEK;
  return { event: WEEKEND_BONUS_EVENTS[positiveModulo(nextWeek, WEEKEND_BONUS_EVENTS.length)], startMs, endMs: startMs + 2 * MS_PER_DAY, type: "weekend" };
}

export function getWeeklyBonusSnapshot(now = Date.now()) {
  const wed = getWedState(now);
  const wknd = getWkndState(now);

  const activeEvent = wed.isActive
    ? { event: WED_BONUS_EVENTS[positiveModulo(wed.week, WED_BONUS_EVENTS.length)], startMs: wed.startMs, endMs: wed.endMs, type: "wednesday" }
    : wknd.isActive
    ? { event: WEEKEND_BONUS_EVENTS[positiveModulo(wknd.week, WEEKEND_BONUS_EVENTS.length)], startMs: wknd.startMs, endMs: wknd.endMs, type: "weekend" }
    : null;

  const nextWed = nextWedOccurrence(now);
  const nextWknd = nextWkndOccurrence(now);
  const nextEvent = nextWed.startMs <= nextWknd.startMs ? nextWed : nextWknd;

  return { activeEvent, nextEvent };
}

export function getWeeklyBonusEvents(startMs, endMs) {
  const events = [];

  // Wednesday events
  const wedFirst = Math.max(0, Math.floor((startMs - WED_BONUS_ANCHOR_MS) / MS_PER_WEEK) - 1);
  for (let week = wedFirst; ; week++) {
    const evStart = WED_BONUS_ANCHOR_MS + week * MS_PER_WEEK;
    const evEnd = evStart + MS_PER_DAY;
    if (evStart > endMs) break;
    if (evEnd > startMs) {
      const def = WED_BONUS_EVENTS[positiveModulo(week, WED_BONUS_EVENTS.length)];
      events.push({ instanceKey: `wed-${week}`, ...def, startMs: evStart, endMs: evEnd, type: "wednesday" });
    }
  }

  // Weekend events
  const wkndFirst = Math.max(0, Math.floor((startMs - WEEKEND_BONUS_ANCHOR_MS) / MS_PER_WEEK) - 1);
  for (let week = wkndFirst; ; week++) {
    const evStart = WEEKEND_BONUS_ANCHOR_MS + week * MS_PER_WEEK;
    const evEnd = evStart + 2 * MS_PER_DAY;
    if (evStart > endMs) break;
    if (evEnd > startMs) {
      const def = WEEKEND_BONUS_EVENTS[positiveModulo(week, WEEKEND_BONUS_EVENTS.length)];
      events.push({ instanceKey: `wknd-${week}`, ...def, startMs: evStart, endMs: evEnd, type: "weekend" });
    }
  }

  events.sort((a, b) => a.startMs - b.startMs);
  return events;
}

const UTC_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const UTC_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatEventDate(ms) {
  const d = new Date(ms);
  return `${UTC_DAY_NAMES[d.getUTCDay()]} ${UTC_MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export const ALL_BONUS_EVENT_DEFS = [
  ...WED_BONUS_EVENTS.map((e) => ({ ...e, scheduleType: "wednesday" })),
  ...WEEKEND_BONUS_EVENTS.map((e) => ({ ...e, scheduleType: "weekend" })),
];
