const MS_PER_DAY = 86400000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

// Single 5-event cycle in order — both Wednesday and Weekend slots pull from this list
export const BONUS_EVENTS = [
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
    key: "damage_gold",
    label: "Damage & Kill Gold",
    accentColor: "#e05555",
    bonuses: [
      { label: "Damage", value: "2x", color: "#e05555" },
      { label: "Kill Gold", value: "2x", color: "#f0c040" },
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
    key: "rank_bp",
    label: "Rank Exp & Battlepass Exp",
    accentColor: "#3a9eff",
    bonuses: [
      { label: "Rank Exp", value: "2x", color: "#3a9eff" },
      { label: "Battlepass Exp", value: "2x", color: "#1e8449" },
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

// Anchors — each is slot 0 for its respective day type in week 0
// Wed Apr 8, 2026  → cycle position (weekNum * 2) % 5
// Sat Apr 11, 2026 → cycle position (weekNum * 2 + 1) % 5
export const WED_ANCHOR_MS  = Date.UTC(2026, 3, 8);   // Wednesday
export const WKND_ANCHOR_MS = Date.UTC(2026, 3, 11);  // Saturday

function getWedState(now) {
  const elapsed   = now - WED_ANCHOR_MS;
  const weekNum   = Math.floor(elapsed / MS_PER_WEEK);
  const dayOffset = Math.floor(positiveModulo(elapsed, MS_PER_WEEK) / MS_PER_DAY);
  const cyclePos  = positiveModulo(weekNum * 2, BONUS_EVENTS.length);
  const startMs   = WED_ANCHOR_MS + weekNum * MS_PER_WEEK;
  const isActive  = elapsed >= 0 && dayOffset === 0;
  return { event: BONUS_EVENTS[cyclePos], isActive, weekNum, dayOffset, startMs, endMs: startMs + MS_PER_DAY, type: "wednesday" };
}

function getWkndState(now) {
  const elapsed   = now - WKND_ANCHOR_MS;
  const weekNum   = Math.floor(elapsed / MS_PER_WEEK);
  const dayOffset = Math.floor(positiveModulo(elapsed, MS_PER_WEEK) / MS_PER_DAY);
  const cyclePos  = positiveModulo(weekNum * 2 + 1, BONUS_EVENTS.length);
  const startMs   = WKND_ANCHOR_MS + weekNum * MS_PER_WEEK;
  const isActive  = elapsed >= 0 && dayOffset < 2;
  return { event: BONUS_EVENTS[cyclePos], isActive, weekNum, dayOffset, startMs, endMs: startMs + 2 * MS_PER_DAY, type: "weekend" };
}

function nextWedOccurrence(now) {
  const { isActive, weekNum, dayOffset } = getWedState(now);
  const nextWeek = (isActive || dayOffset === 0) ? weekNum + 1 : weekNum + 1;
  const startMs  = WED_ANCHOR_MS + nextWeek * MS_PER_WEEK;
  const cyclePos = positiveModulo(nextWeek * 2, BONUS_EVENTS.length);
  return { event: BONUS_EVENTS[cyclePos], startMs, endMs: startMs + MS_PER_DAY, type: "wednesday" };
}

function nextWkndOccurrence(now) {
  const { isActive, weekNum, dayOffset } = getWkndState(now);
  const nextWeek = (isActive || dayOffset < 2) ? weekNum + 1 : weekNum + 1;
  const startMs  = WKND_ANCHOR_MS + nextWeek * MS_PER_WEEK;
  const cyclePos = positiveModulo(nextWeek * 2 + 1, BONUS_EVENTS.length);
  return { event: BONUS_EVENTS[cyclePos], startMs, endMs: startMs + 2 * MS_PER_DAY, type: "weekend" };
}

export function getWeeklyBonusSnapshot(now = Date.now()) {
  const wed  = getWedState(now);
  const wknd = getWkndState(now);

  const activeEvent = wed.isActive  ? { event: wed.event,  startMs: wed.startMs,  endMs: wed.endMs,  type: "wednesday" }
                    : wknd.isActive ? { event: wknd.event, startMs: wknd.startMs, endMs: wknd.endMs, type: "weekend" }
                    : null;

  const nextWed  = nextWedOccurrence(now);
  const nextWknd = nextWkndOccurrence(now);
  const nextEvent = nextWed.startMs <= nextWknd.startMs ? nextWed : nextWknd;

  return { activeEvent, nextEvent };
}

export function getWeeklyBonusEvents(startMs, endMs) {
  const events = [];

  // Wednesday events
  const wedFirstWeek = Math.floor((startMs - WED_ANCHOR_MS) / MS_PER_WEEK) - 1;
  for (let week = Math.max(0, wedFirstWeek); ; week++) {
    const evStart  = WED_ANCHOR_MS + week * MS_PER_WEEK;
    const evEnd    = evStart + MS_PER_DAY;
    if (evStart > endMs) break;
    if (evEnd > startMs) {
      const cyclePos = positiveModulo(week * 2, BONUS_EVENTS.length);
      events.push({ instanceKey: `wed-${week}`, ...BONUS_EVENTS[cyclePos], startMs: evStart, endMs: evEnd, type: "wednesday" });
    }
  }

  // Weekend events
  const wkndFirstWeek = Math.floor((startMs - WKND_ANCHOR_MS) / MS_PER_WEEK) - 1;
  for (let week = Math.max(0, wkndFirstWeek); ; week++) {
    const evStart  = WKND_ANCHOR_MS + week * MS_PER_WEEK;
    const evEnd    = evStart + 2 * MS_PER_DAY;
    if (evStart > endMs) break;
    if (evEnd > startMs) {
      const cyclePos = positiveModulo(week * 2 + 1, BONUS_EVENTS.length);
      events.push({ instanceKey: `wknd-${week}`, ...BONUS_EVENTS[cyclePos], startMs: evStart, endMs: evEnd, type: "weekend" });
    }
  }

  events.sort((a, b) => a.startMs - b.startMs);
  return events;
}

const UTC_DAY_NAMES   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const UTC_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatEventDate(ms) {
  const d = new Date(ms);
  return `${UTC_DAY_NAMES[d.getUTCDay()]} ${UTC_MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export const ALL_BONUS_EVENT_DEFS = BONUS_EVENTS;
