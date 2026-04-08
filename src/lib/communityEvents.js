export const COMMUNITY_EVENT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// Anchor: Mon Mar 30, 2026 UTC midnight — events run Monday–Sunday
export const COMMUNITY_EVENT_ANCHOR_MS = Date.UTC(2026, 2, 30);
export const COMMUNITY_EVENT_ANCHOR_INDEX = 2;

export const COMMUNITY_EVENT_ITEMS = [
  {
    key: "killAliensShadows",
    label: "Kill Aliens/Shadows",
    accentColor: "#f5921e",
    goal: "Farm Alien and Shadow enemy kills to contribute to the group goal.",
  },
  {
    key: "gemsSpent",
    label: "Gems Spent",
    accentColor: "#33cccc",
    goal: "Spend gems to contribute to the group goal.",
  },
  {
    key: "enemyKills",
    label: "Enemy Kills",
    accentColor: "#2ecc71",
    goal: "Farm enemy kills to contribute to the group goal.",
  },
  {
    key: "bpExperience",
    label: "BP Experience",
    accentColor: "#c58cff",
    goal: "Earn battlepass experience to contribute to the group goal.",
  },
];

function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

export function getCommunityEventsInRange(startMs, endMs) {
  const n = COMMUNITY_EVENT_ITEMS.length;
  const firstWeek = Math.floor((startMs - COMMUNITY_EVENT_ANCHOR_MS) / COMMUNITY_EVENT_INTERVAL_MS) - 1;
  const events = [];

  for (let week = firstWeek; ; week++) {
    const evStart = COMMUNITY_EVENT_ANCHOR_MS + week * COMMUNITY_EVENT_INTERVAL_MS;
    const evEnd = evStart + COMMUNITY_EVENT_INTERVAL_MS;
    if (evStart > endMs) break;
    if (evEnd > startMs) {
      const index = positiveModulo(COMMUNITY_EVENT_ANCHOR_INDEX + week, n);
      events.push({
        instanceKey: `ce-${week}`,
        ...COMMUNITY_EVENT_ITEMS[index],
        startMs: evStart,
        endMs: evEnd,
      });
    }
  }

  return events;
}
