import playerBackgroundsData from "../data/player_backgrounds.json";
import playerIconsData from "../data/player_icons.json";
import premiumsData from "../data/premiums.json";
import STAT_UNITS from "../data/stat_units.json";
import { schedulePersistLoadoutRuntime } from "./loadoutRuntimeStore";

export const PLAYER_LOADOUT_STATE_STORAGE_KEY = "ihtddata.playerLoadout.state.v1";

const PREMIUM_GROUP_NAME = "Premiums";

const PREMIUM_EFFECT_CONFIG = Object.freeze({
  damage_multiplier: {
    label: "Damage Multiplier",
    statKey: "damageMultiplier",
    valueType: "multiplier",
    getAmount(value) {
      return Number(value) || 1;
    },
    formatValue(value) {
      return formatMultiplierValue(value);
    },
  },
  kill_gold_multiplier: {
    label: "Kill Gold Multiplier",
    statKey: "killGoldMultiplier",
    valueType: "multiplier",
    getAmount(value) {
      return Number(value) || 1;
    },
    formatValue(value) {
      return formatMultiplierValue(value);
    },
  },
  prestige_power_multiplier: {
    label: "Prestige Power Multiplier",
    statKey: "prestigePowerMultiplier",
    valueType: "multiplier",
    getAmount(value) {
      return Number(value) || 1;
    },
    formatValue(value) {
      return formatMultiplierValue(value);
    },
  },
  rank_exp_multiplier: {
    label: "Rank Exp Multiplier",
    statKey: "rankExpMultiplier",
    valueType: "multiplier",
    getAmount(value) {
      return Number(value) || 1;
    },
    formatValue(value) {
      return formatMultiplierValue(value);
    },
  },
  battlepass_exp_multiplier: {
    label: "Battlepass Exp Multiplier",
    statKey: "battlepassExpMultiplier",
    valueType: "multiplier",
    getAmount(value) {
      return Number(value) || 1;
    },
    formatValue(value) {
      return formatMultiplierValue(value);
    },
  },
  active_play_cooldown_minutes: {
    label: "Active Play Cooldown",
    formatValue(value) {
      return `${formatDecimal(value)} min`;
    },
  },
  continue_wave_cost: {
    label: "Continue Wave Cost",
    formatValue(value) {
      return value === 0 ? "Free" : `${formatDecimal(value)} Gems`;
    },
  },
  offline_progress_limit: {
    label: "Offline Progress Limit",
    formatValue(value) {
      return value === "infinite" ? "Infinite" : String(value ?? "-");
    },
  },
  max_game_speed: {
    label: "Max Game Speed",
    formatValue(value) {
      return formatMultiplierValue(value);
    },
  },
});

const RAW_PLAYER_LOADOUT_TABS = [
  { key: "icons", label: "Icons", data: playerIconsData },
  { key: "backgrounds", label: "Backgrounds", data: playerBackgroundsData },
  { key: "premiums", label: "Premiums", data: createPremiumTabData(premiumsData) },
];

export const PLAYER_LOADOUT_TABS = Object.freeze(
  RAW_PLAYER_LOADOUT_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    menuIcon: tab.data.menuIcon,
    data: tab.data,
  }))
);

export const PLAYER_LOADOUT_TAB_MAP = Object.freeze(
  Object.fromEntries(PLAYER_LOADOUT_TABS.map((tab) => [tab.key, tab]))
);

const TAB_KEYS = new Set(PLAYER_LOADOUT_TABS.map((tab) => tab.key));
const TAB_GROUP_KEYS = Object.freeze(
  Object.fromEntries(
    PLAYER_LOADOUT_TABS.map((tab) => [tab.key, Object.keys(tab.data.groups ?? {})])
  )
);

const TAB_ITEM_MAP = Object.freeze(
  Object.fromEntries(
    PLAYER_LOADOUT_TABS.map((tab) => [
      tab.key,
      Object.fromEntries(
        Object.values(tab.data.groups)
          .flat()
          .map((item) => [item.id, item])
      ),
    ])
  )
);

const LABEL_TO_STAT_UNIT_KEY = Object.freeze(
  Object.fromEntries(
    Object.entries(STAT_UNITS).map(([key, value]) => [normalizeRewardUnitLabel(value.label), key])
  )
);

const EXPLICIT_REWARD_UNIT_KEY_MAP = Object.freeze({
  damage: "damage",
  "kill gold": "killGold",
  "prestige power": "prestigePower",
  "enemy speed": "enemyMoveSpeed",
  "enemy hp": "enemyHp",
  "rank exp": "rankExpBonus",
  "rank exp pct": "rankExpBonus",
  "rank exp %": "rankExpBonus",
  range: "range",
  "battlepass exp": "battlepassExp",
  "energy income": "energyIncome",
  "goblin hoarder gold": "goblinHoarderGold",
  "power mage energy": "powerMageEnergy",
  "training dummy exp": "trainingDummyExp",
  "shadow runes": "shadowRunes",
  "alien tech": "alienTech",
  "ultimus tokens": "ultimusTokens",
  "super gold amount": "superGoldAmount",
  "ultra gold amount": "ultraGoldAmount",
  "super exp amount": "superExpAmount",
  "ultra exp amount": "ultraExpAmount",
  "super energy amount": "superEnergyAmount",
  "ultra energy amount": "ultraEnergyAmount",
  "skill power": "skillPower",
  "tournament trophies": "tournamentTrophies",
  "ad bonus bonus": "adBonusReward",
  "goblin hoarder cooldown": "goblinHoarderCooldown",
  "power mage cooldown": "powerMageCooldown",
  "rarer runes": "runeRarityChance",
  "goblin hoarder spawns": "goblinHoarderSpawns",
  "power mage spawns": "powerMageSpawns",
  "active play duration": "activePlayDuration",
});

function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function normalizeRewardUnitLabel(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[%()]/g, " ")
    .replace(/\s+/g, " ");
}

function snakeToCamel(value) {
  return String(value ?? "").replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function formatDecimal(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value ?? "-");
  }

  return Number.isInteger(numeric)
    ? numeric.toString()
    : numeric.toFixed(2).replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function formatMultiplierValue(value) {
  return `x${formatDecimal(value)}`;
}

function humanizeEffectKey(effectKey) {
  return String(effectKey ?? "")
    .replace(/_+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildPremiumEffect(effectKey, value) {
  const config = PREMIUM_EFFECT_CONFIG[effectKey];
  const amount = typeof config?.getAmount === "function" ? config.getAmount(value) : null;

  return {
    key: effectKey,
    label: config?.label ?? humanizeEffectKey(effectKey),
    rawValue: value,
    valueText: typeof config?.formatValue === "function" ? config.formatValue(value) : String(value ?? "-"),
    statKey: config?.statKey ?? null,
    valueType: config?.valueType ?? null,
    amount,
  };
}

function createPremiumTabData(rawPremiumsData) {
  return {
    menuIcon: null,
    label: "Premiums",
    groups: {
      [PREMIUM_GROUP_NAME]: (rawPremiumsData?.premiums ?? []).map((premium) => {
        const effects = Object.entries(premium?.effects ?? {}).map(([effectKey, value]) => buildPremiumEffect(effectKey, value));

        return {
          id: premium.id,
          name: premium.name,
          description: premium.description,
          effects,
          rewardEntries: effects
            .filter((effect) => effect.statKey && Number.isFinite(Number(effect.amount)))
            .map((effect) => ({
              statKey: effect.statKey,
              amount: Number(effect.amount),
              valueType: effect.valueType,
              statLabel: effect.label,
              groupLabel: premium.name,
            })),
        };
      }),
    },
  };
}

function getDefaultSelectedTab() {
  return PLAYER_LOADOUT_TABS[0]?.key ?? "icons";
}

function getDefaultSelectedGroup(tabKey) {
  return TAB_GROUP_KEYS[tabKey]?.[0] ?? "";
}

function normalizePurchasedMap(tabKey, rawPurchased) {
  const itemMap = TAB_ITEM_MAP[tabKey] ?? {};
  const nextPurchased = {};

  if (!isObject(rawPurchased)) {
    return nextPurchased;
  }

  Object.keys(itemMap).forEach((itemId) => {
    if (rawPurchased[itemId]) {
      nextPurchased[itemId] = true;
    }
  });

  return nextPurchased;
}

function normalizeSelectedGroupByTab(rawSelectedGroupByTab) {
  return Object.fromEntries(
    PLAYER_LOADOUT_TABS.map((tab) => {
      const availableGroups = TAB_GROUP_KEYS[tab.key] ?? [];
      const requestedGroup = rawSelectedGroupByTab?.[tab.key];
      const selectedGroup = availableGroups.includes(requestedGroup)
        ? requestedGroup
        : getDefaultSelectedGroup(tab.key);
      return [tab.key, selectedGroup];
    })
  );
}

export function normalizePlayerLoadoutState(rawState) {
  const selectedTab = TAB_KEYS.has(rawState?.selectedTab) ? rawState.selectedTab : getDefaultSelectedTab();
  const purchasedByTab = {};

  PLAYER_LOADOUT_TABS.forEach((tab) => {
    purchasedByTab[tab.key] = normalizePurchasedMap(tab.key, rawState?.purchasedByTab?.[tab.key]);
  });

  return {
    selectedTab,
    selectedGroupByTab: normalizeSelectedGroupByTab(rawState?.selectedGroupByTab),
    purchasedByTab,
  };
}

export function readPlayerLoadoutState(storage = localStorage) {
  let parsedState = {};

  try {
    parsedState = JSON.parse(storage.getItem(PLAYER_LOADOUT_STATE_STORAGE_KEY) ?? "{}");
  } catch {
    parsedState = {};
  }

  return normalizePlayerLoadoutState(parsedState);
}

export function writePlayerLoadoutState(state, storage = localStorage) {
  storage.setItem(PLAYER_LOADOUT_STATE_STORAGE_KEY, JSON.stringify(normalizePlayerLoadoutState(state)));
  schedulePersistLoadoutRuntime(storage);
}

export function getPlayerLoadoutItems(tabKey) {
  return Object.values(TAB_ITEM_MAP[tabKey] ?? {});
}

export function getPlayerLoadoutItem(tabKey, itemId) {
  return TAB_ITEM_MAP[tabKey]?.[itemId] ?? null;
}

export function mapPlayerRewardUnitToStatKey(rewardUnit) {
  const normalizedLabel = normalizeRewardUnitLabel(rewardUnit);
  if (!normalizedLabel) {
    return null;
  }

  const explicitKey = EXPLICIT_REWARD_UNIT_KEY_MAP[normalizedLabel];
  if (explicitKey) {
    return explicitKey;
  }

  const statUnitKey = LABEL_TO_STAT_UNIT_KEY[normalizedLabel];
  if (statUnitKey) {
    return snakeToCamel(statUnitKey);
  }

  return snakeToCamel(normalizedLabel.replace(/[^a-z0-9]+/g, "_"));
}

export function getPlayerLoadoutPurchasedEntries(state) {
  const normalized = normalizePlayerLoadoutState(state);
  const entries = [];

  PLAYER_LOADOUT_TABS.forEach((tab) => {
    const purchased = normalized.purchasedByTab[tab.key] ?? {};

    getPlayerLoadoutItems(tab.key).forEach((item) => {
      if (!purchased[item.id]) {
        return;
      }

      const rewardEntries = Array.isArray(item.rewardEntries)
        ? item.rewardEntries
        : item.reward != null && item.rewardUnit
          ? [{
              statKey: mapPlayerRewardUnitToStatKey(item.rewardUnit),
              amount: Number(item.reward) || 0,
              valueType: item.reward_type ?? null,
              statLabel: item.rewardUnit,
              groupLabel: tab.label,
            }]
          : [];

      rewardEntries.forEach((rewardEntry) => {
        if (!rewardEntry?.statKey) {
          return;
        }

        entries.push({
          statKey: rewardEntry.statKey,
          amount: Number(rewardEntry.amount) || 0,
          system: "playerLoadout",
          sourceType: tab.key,
          sourceId: item.id,
          sourceLabel: item.name,
          groupLabel: rewardEntry.groupLabel ?? tab.label,
          statLabel: rewardEntry.statLabel ?? item.rewardUnit,
          valueType: rewardEntry.valueType ?? item.reward_type ?? null,
        });
      });
    });
  });

  return entries;
}

export function getPlayerLoadoutBonusTotals(state) {
  return getPlayerLoadoutPurchasedEntries(state).reduce((totals, entry) => {
    if (entry.valueType === "multiplier") {
      totals[entry.statKey] = (totals[entry.statKey] ?? 1) * entry.amount;
      return totals;
    }

    totals[entry.statKey] = (totals[entry.statKey] ?? 0) + entry.amount;
    return totals;
  }, {});
}