import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { MapStage, OverlayAnchor, HeroToken } from "../map/MapStage";
import { mapsData } from "../../lib/gameData";
import { LOADOUT_BUILDER_PLACEMENTS_STORAGE_KEY, LOADOUT_BUILDER_SELECTED_MAP_STORAGE_KEY } from "../../lib/loadoutBuilderSave";
import { getPerkCurrentBonus, getPlacementBonusValue, readMapLoadoutBuilderMode, readMapLoadoutState, writeMapLoadoutBuilderMode } from "../../lib/mapLoadout";
import { getStatsLoadoutBonusTotals, readStatsLoadoutState } from "../../lib/statsLoadout";
import { MapPerksLoadoutBuilder } from "./MapPerksLoadoutBuilder";

const MAX_DUPLICATE_HEROES = 3;
const RANGE_RADIUS_SCALE = 0.085;
const FILTER_TABS = [
  { id: "search", label: "Search" },
  { id: "identity", label: "Identity" },
  { id: "effects", label: "Effects" },
  { id: "progression", label: "Progression" },
];
const FILTER_SUBTABS = {
  search: [
    { id: "query", label: "Query" },
    { id: "state", label: "State" },
  ],
  identity: [
    { id: "class", label: "Class" },
    { id: "rarity", label: "Rarity" },
  ],
  effects: [
    { id: "type", label: "Type" },
    { id: "subtype", label: "Subtype" },
  ],
  progression: [
    { id: "milestones", label: "Milestones" },
    { id: "synergies", label: "Synergies" },
  ],
};
const DEFAULT_FILTER_SUBTABS = {
  search: "query",
  identity: "class",
  effects: "type",
  progression: "milestones",
};
const SEARCH_SCOPE_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "skills", label: "Skills" },
  { id: "mastery", label: "Mastery" },
  { id: "milestones", label: "Milestones" },
  { id: "synergies", label: "Synergies" },
];
const FOCUSED_HERO_INFO_TABS = [
  { id: "skill", label: "Skill" },
  { id: "milestones", label: "Milestones" },
  { id: "synergies", label: "Synergies" },
];
const RARITY_SORT_ORDER = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Ascended"];
const HERO_STAT_BONUS_ALIASES = Object.freeze({
  damage: ["damage", "strength"],
  attackSpeed: ["attack_speed", "agility"],
  range: ["range", "hawk_eyes"],
  critChance: ["crit_chance", "precision"],
  critDamage: ["crit_damage", "power"],
  skillPower: ["skill_power", "enchanted"],
  skillCooldown: ["skill_cooldown", "accelerate"],
  superCritChance: ["super_crit_chance"],
  superCritDamage: ["super_crit_damage"],
  ultraCritChance: ["ultra_crit_chance"],
  ultraCritDamage: ["ultra_crit_damage"],
});

const HERO_STAT_LABELS = Object.freeze({
  attackSpeed: "Attack Speed",
  critChance: "Crit Chance",
  critDamage: "Crit Damage",
  superCritChance: "Super Crit Chance",
  superCritDamage: "Super Crit Damage",
  ultraCritChance: "Ultra Crit Chance",
  ultraCritDamage: "Ultra Crit Damage",
  skillPower: "Skill Power",
  skillCooldown: "Skill Cooldown",
  splashDamage: "Splash Damage",
  instantSkillChance: "Instant Skill Chance",
  instantSpellChance: "Instant Spell Chance",
  synergyBonus: "Synergy Effects",
  milestoneBonus: "Milestone Effects",
  mastery2xExpChance: "2x Mastery Exp Chance",
  killGold: "Kill Gold",
  rankExpBonus: "Rank Exp",
  spellCooldown: "Spell Cooldown",
  superExpChance: "Super Exp Chance",
  superExpAmount: "Super Exp Amount",
  superGoldChance: "Super Gold Chance",
  superGoldAmount: "Super Gold Amount",
  superEnergyChance: "Super Energy Chance",
  superEnergyAmount: "Super Energy Amount",
  activePlayBonus: "Active Play Bonus",
  wavePerkBonus: "Wave Perk Bonus",
  enemyMoveSpeed: "Enemy Move Speed",
  enemySpawnSpeed: "Enemy Spawn Speed",
  prestigePower: "Prestige Power",
  battlepassExp: "Battlepass Exp",
  extraBossChance: "Extra Boss Chance",
  mimicBossChance: "Mimic Boss Chance",
  trainerSpawns: "Trainer Spawns",
  bossRushSkip: "Boss Rush Skip",
  powerMageSpawns: "Power Mage Spawns",
  powerMageCooldown: "Power Mage Cooldown",
  powerMageGoldenChance: "Power Mage Golden Chance",
});

const MAP_PLACEMENT_BONUS_KEY_MAP = Object.freeze({
  damage: "damage",
  attSpeed: "attackSpeed",
  range: "range",
  skillCd: "skillCooldown",
  skillPowerPct: "skillPower",
  killGold: "killGold",
  killExpPct: "rankExpBonus",
  milestoneBonus: "milestoneBonus",
  synergyBonus: "synergyBonus",
  mastery2xExpChance: "mastery2xExpChance",
});

const MAP_PERK_KEY_RULES = Object.freeze([
  ["super_crit_chance", "superCritChance"],
  ["super_crit_damage", "superCritDamage"],
  ["ultra_crit_chance", "ultraCritChance"],
  ["ultra_crit_damage", "ultraCritDamage"],
  ["crit_chance", "critChance"],
  ["crit_damage", "critDamage"],
  ["attack_speed", "attackSpeed"],
  ["skill_cooldown", "skillCooldown"],
  ["spell_cooldown", "spellCooldown"],
  ["skill_power", "skillPower"],
  ["instant_skill_chance", "instantSkillChance"],
  ["instant_spell_chance", "instantSpellChance"],
  ["splash_damage", "splashDamage"],
  ["synergy", "synergyBonus"],
  ["milestone", "milestoneBonus"],
  ["mastery_skill_power", "skillPower"],
  ["2x_mastery_exp_chance", "mastery2xExpChance"],
  ["range", "range"],
  ["damage", "damage"],
  ["kill_gold", "killGold"],
  ["rank_exp", "rankExpBonus"],
  ["super_exp_chance", "superExpChance"],
  ["super_exp_amount", "superExpAmount"],
  ["super_gold_chance", "superGoldChance"],
  ["super_gold_amount", "superGoldAmount"],
  ["super_energy_chance", "superEnergyChance"],
  ["super_energy_amount", "superEnergyAmount"],
  ["active_play_bonus", "activePlayBonus"],
  ["wave_perk", "wavePerkBonus"],
  ["enemy_move_speed", "enemyMoveSpeed"],
  ["enemy_spawn_speed", "enemySpawnSpeed"],
  ["prestige_power", "prestigePower"],
  ["battlepass_exp", "battlepassExp"],
  ["extra_boss_chance", "extraBossChance"],
  ["mimic_boss_chance", "mimicBossChance"],
  ["trainer_spawns", "trainerSpawns"],
  ["boss_rush_skip", "bossRushSkip"],
  ["power_mage_spawns", "powerMageSpawns"],
  ["power_mage_cooldown", "powerMageCooldown"],
  ["power_mage_golden_chance", "powerMageGoldenChance"],
]);

function sumBonusTotals(totals, aliases = []) {
  return aliases.reduce((sum, key) => sum + (totals[key] ?? 0), 0);
}

function addBonusTotal(target, key, amount) {
  if (!key || !Number.isFinite(Number(amount))) {
    return target;
  }

  target[key] = (target[key] ?? 0) + Number(amount);
  return target;
}

function mergeBonusTotals(...sources) {
  const totals = {};

  sources.forEach((source) => {
    Object.entries(source ?? {}).forEach(([key, amount]) => {
      addBonusTotal(totals, key, amount);
    });
  });

  return totals;
}

function normalizeMapPlacementBonusKey(statKey) {
  return MAP_PLACEMENT_BONUS_KEY_MAP[statKey] ?? null;
}

function inferMapPerkBonusKey(perk) {
  const rawId = String(perk?.id ?? "").toLowerCase();
  const rawName = String(perk?.name ?? "").toLowerCase().replace(/[%()\s+-]+/g, "_");
  const searchValue = `${rawId} ${rawName}`;

  for (const [needle, key] of MAP_PERK_KEY_RULES) {
    if (searchValue.includes(needle)) {
      return key;
    }
  }

  return null;
}

function formatHeroStatValue(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return String(value ?? "-");
  }

  return Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(2).replace(/\.00$/, "");
}

function buildHeroUpgradeStats(hero, bonusTotals) {
  const baseStats = hero.baseStats ?? {};
  const damageBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.damage);
  const attackSpeedBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.attackSpeed);
  const rangeBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.range);
  const critChanceBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.critChance);
  const critDamageBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.critDamage);
  const skillPowerBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.skillPower);
  const skillCooldownBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.skillCooldown);
  const superCritChanceBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.superCritChance);
  const superCritDamageBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.superCritDamage);
  const ultraCritChanceBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.ultraCritChance);
  const ultraCritDamageBonus = sumBonusTotals(bonusTotals, HERO_STAT_BONUS_ALIASES.ultraCritDamage);
  const splashDamageBonus = bonusTotals.splashDamage ?? 0;
  const instantSkillChanceBonus = bonusTotals.instantSkillChance ?? 0;
  const instantSpellChanceBonus = bonusTotals.instantSpellChance ?? 0;
  const synergyBonus = bonusTotals.synergyBonus ?? 0;
  const milestoneBonus = bonusTotals.milestoneBonus ?? 0;
  const mastery2xExpChanceBonus = bonusTotals.mastery2xExpChance ?? 0;
  const killGoldBonus = bonusTotals.killGold ?? 0;
  const rankExpBonus = bonusTotals.rankExpBonus ?? 0;
  const spellCooldownBonus = bonusTotals.spellCooldown ?? 0;
  const superExpChanceBonus = bonusTotals.superExpChance ?? 0;
  const superExpAmountBonus = bonusTotals.superExpAmount ?? 0;
  const superGoldChanceBonus = bonusTotals.superGoldChance ?? 0;
  const superGoldAmountBonus = bonusTotals.superGoldAmount ?? 0;
  const superEnergyChanceBonus = bonusTotals.superEnergyChance ?? 0;
  const superEnergyAmountBonus = bonusTotals.superEnergyAmount ?? 0;
  const activePlayBonus = bonusTotals.activePlayBonus ?? 0;
  const wavePerkBonus = bonusTotals.wavePerkBonus ?? 0;
  const enemyMoveSpeed = bonusTotals.enemyMoveSpeed ?? 0;
  const enemySpawnSpeed = bonusTotals.enemySpawnSpeed ?? 0;
  const prestigePowerBonus = bonusTotals.prestigePower ?? 0;
  const battlepassExpBonus = bonusTotals.battlepassExp ?? 0;
  const extraBossChanceBonus = bonusTotals.extraBossChance ?? 0;
  const mimicBossChanceBonus = bonusTotals.mimicBossChance ?? 0;
  const trainerSpawnsBonus = bonusTotals.trainerSpawns ?? 0;
  const bossRushSkipBonus = bonusTotals.bossRushSkip ?? 0;
  const powerMageSpawnsBonus = bonusTotals.powerMageSpawns ?? 0;
  const powerMageCooldownBonus = bonusTotals.powerMageCooldown ?? 0;
  const powerMageGoldenChanceBonus = bonusTotals.powerMageGoldenChance ?? 0;
  const adjustedSkillCooldown = typeof hero.skill?.cooldown === "number"
    ? Math.max(0, hero.skill.cooldown * (1 - skillCooldownBonus / 100))
    : null;

  const adjustedBaseStats = { ...baseStats };

  if (typeof adjustedBaseStats.damage === "number") {
    adjustedBaseStats.damage = adjustedBaseStats.damage * (1 + damageBonus / 100);
  }

  if (typeof adjustedBaseStats.attackSpeed === "number") {
    adjustedBaseStats.attackSpeed = adjustedBaseStats.attackSpeed * (1 + attackSpeedBonus / 100);
  }

  if (typeof adjustedBaseStats.range === "number") {
    adjustedBaseStats.range = adjustedBaseStats.range * (1 + rangeBonus / 100);
  }

  if (typeof adjustedBaseStats.dps === "number") {
    adjustedBaseStats.dps = adjustedBaseStats.dps * (1 + damageBonus / 100) * (1 + attackSpeedBonus / 100);
  }

  const displayStats = Object.entries(adjustedBaseStats).map(([key, value]) => ({
    key,
    label: formatFilterLabel(key),
    value: formatHeroStatValue(value),
    bonusLabel: (() => {
      if (key === "damage" && damageBonus) return `+${formatHeroStatValue(damageBonus)}% from upgrades`;
      if (key === "attackSpeed" && attackSpeedBonus) return `+${formatHeroStatValue(attackSpeedBonus)}% from upgrades`;
      if (key === "range" && rangeBonus) return `+${formatHeroStatValue(rangeBonus)}% from upgrades`;
      if (key === "dps" && (damageBonus || attackSpeedBonus)) return `Damage + Attack Speed applied`;
      return null;
    })(),
  }));

  const derivedStats = [
    { key: "critChance", bonus: critChanceBonus },
    { key: "critDamage", bonus: critDamageBonus },
    { key: "superCritChance", bonus: superCritChanceBonus },
    { key: "superCritDamage", bonus: superCritDamageBonus },
    { key: "ultraCritChance", bonus: ultraCritChanceBonus },
    { key: "ultraCritDamage", bonus: ultraCritDamageBonus },
    { key: "skillPower", bonus: skillPowerBonus },
    { key: "skillCooldown", bonus: skillCooldownBonus, value: adjustedSkillCooldown != null ? `${formatHeroStatValue(adjustedSkillCooldown)}s` : `+${formatHeroStatValue(skillCooldownBonus)}%` },
    { key: "splashDamage", bonus: splashDamageBonus },
    { key: "instantSkillChance", bonus: instantSkillChanceBonus },
    { key: "instantSpellChance", bonus: instantSpellChanceBonus },
    { key: "synergyBonus", bonus: synergyBonus },
    { key: "milestoneBonus", bonus: milestoneBonus },
    { key: "mastery2xExpChance", bonus: mastery2xExpChanceBonus },
    { key: "killGold", bonus: killGoldBonus },
    { key: "rankExpBonus", bonus: rankExpBonus },
    { key: "spellCooldown", bonus: spellCooldownBonus },
    { key: "superExpChance", bonus: superExpChanceBonus },
    { key: "superExpAmount", bonus: superExpAmountBonus },
    { key: "superGoldChance", bonus: superGoldChanceBonus },
    { key: "superGoldAmount", bonus: superGoldAmountBonus },
    { key: "superEnergyChance", bonus: superEnergyChanceBonus },
    { key: "superEnergyAmount", bonus: superEnergyAmountBonus },
    { key: "activePlayBonus", bonus: activePlayBonus },
    { key: "wavePerkBonus", bonus: wavePerkBonus },
    { key: "enemyMoveSpeed", bonus: enemyMoveSpeed },
    { key: "enemySpawnSpeed", bonus: enemySpawnSpeed },
    { key: "prestigePower", bonus: prestigePowerBonus },
    { key: "battlepassExp", bonus: battlepassExpBonus },
    { key: "extraBossChance", bonus: extraBossChanceBonus },
    { key: "mimicBossChance", bonus: mimicBossChanceBonus },
    { key: "trainerSpawns", bonus: trainerSpawnsBonus },
    { key: "bossRushSkip", bonus: bossRushSkipBonus },
    { key: "powerMageSpawns", bonus: powerMageSpawnsBonus },
    { key: "powerMageCooldown", bonus: powerMageCooldownBonus },
    { key: "powerMageGoldenChance", bonus: powerMageGoldenChanceBonus },
  ]
    .filter((entry) => entry.bonus)
    .map((entry) => ({
      key: entry.key,
      label: HERO_STAT_LABELS[entry.key] ?? formatFilterLabel(entry.key),
      value: entry.value ?? `+${formatHeroStatValue(entry.bonus)}%`,
      bonusLabel: adjustedSkillCooldown != null && entry.key === "skillCooldown"
        ? `${formatHeroStatValue(entry.bonus)}% reduction from active bonuses`
        : "Active bonus",
    }));

  return {
    adjustedBaseStats,
    displayStats: [...displayStats, ...derivedStats],
    adjustedSkill: adjustedSkillCooldown != null
      ? {
          ...hero.skill,
          cooldown: adjustedSkillCooldown,
        }
      : hero.skill,
  };
}

function buildPlacementState(spots, existingPlacements = {}) {
  const nextPlacements = {};
  spots.forEach((spot) => {
    nextPlacements[spot.id] = typeof existingPlacements?.[spot.id] === "string" ? existingPlacements[spot.id] : null;
  });
  return nextPlacements;
}

function normalizePlacementsByMap(maps, storedPlacements) {
  return Object.fromEntries(
    maps.map((map) => [map.id, buildPlacementState(map.spots, storedPlacements?.[map.id])])
  );
}

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getRangeRadiusPx(rangeValue, stageWidth, stageHeight) {
  const numericRange = Number(rangeValue);

  if (!Number.isFinite(numericRange) || numericRange <= 0) {
    return 0;
  }

  return numericRange * Math.min(stageWidth, stageHeight) * RANGE_RADIUS_SCALE;
}

function getSpotPixelPoint(spot, stageWidth, stageHeight) {
  return {
    x: spot.x * stageWidth,
    y: spot.y * stageHeight,
  };
}

function getDistanceBetweenPoints(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function formatFilterLabel(value) {
  return String(value ?? "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toggleSelection(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function buildHeroSearchIndex(hero) {
  return {
    name: normalizeText([
      hero.name,
      hero.id,
      hero.class,
      hero.rarity,
      hero.type,
      ...(hero.typeSubtype ?? []),
    ].filter(Boolean).join(" ")),
    skills: normalizeText([
      hero.skill?.name,
      hero.skill?.description,
      hero.skill?.powerDescription,
      hero.skill?.durationDescription,
    ].filter(Boolean).join(" ")),
    mastery: normalizeText(hero.masteryDescription),
    milestones: normalizeText((hero.milestones ?? []).flatMap((milestone) => [
      milestone.name,
      milestone.type,
      milestone.scope,
      milestone.description,
    ]).filter(Boolean).join(" ")),
    synergies: normalizeText((hero.synergies ?? []).flatMap((synergy) => [
      synergy.name,
      synergy.type,
      synergy.scope,
      synergy.description,
      synergy.hero1,
      synergy.hero2,
    ]).filter(Boolean).join(" ")),
  };
}

function getEnabledSearchScopes(searchScopes) {
  const enabled = Object.entries(searchScopes)
    .filter(([, value]) => value)
    .map(([key]) => key);

  return enabled.length ? enabled : SEARCH_SCOPE_OPTIONS.map((option) => option.id);
}

function matchesSearchTerms(value, searchTerms) {
  const normalizedValue = normalizeText(value);
  return !searchTerms.length || searchTerms.every((term) => normalizedValue.includes(term));
}

function getSynergyTeamLabel(synergy) {
  return [synergy.hero1, synergy.hero2].filter(Boolean).join(" + ");
}

function matchesSynergyTeamMembers(synergy, searchTerms) {
  return matchesSearchTerms([synergy.hero1, synergy.hero2].filter(Boolean).join(" "), searchTerms);
}

function formatSynergyMatchDetail(synergy, searchTerms) {
  const teamLabel = getSynergyTeamLabel(synergy);

  if (teamLabel && matchesSynergyTeamMembers(synergy, searchTerms)) {
    return `${synergy.name}: ${teamLabel}${synergy.description ? ` · ${synergy.description}` : ""}`;
  }

  return `${synergy.name}: ${synergy.description}`;
}

function getSubtypeKeywords(subtype) {
  const keywordMap = {
    experience: ["exp", "experience", "rank exp", "boss exp", "super exp", "ultra exp"],
    attackSpeed: ["attack speed"],
    damage: ["damage"],
    critChance: ["crit chance"],
    critDamage: ["crit damage"],
    superCritChance: ["super crit chance"],
    superCritDamage: ["super crit damage"],
    ultraCritChance: ["ultra crit chance"],
    skillCooldown: ["skill cooldown", "cooldown"],
    splashDamage: ["splash damage", "splash"],
    range: ["range"],
    multiTarget: ["additional nearby enemies", "target +1x", "cleaved enemy"],
    slow: ["slow", "movement speed"],
    stun: ["stun", "stunned"],
    confuse: ["confuse", "confused", "run backwards"],
    teleport: ["teleport", "start of the maze"],
  };

  return keywordMap[subtype] ?? [formatFilterLabel(subtype).toLowerCase()];
}

function collectDetailMatches(hero, filters) {
  const matches = [];
  const searchTerms = filters.searchValue
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (searchTerms.length) {
    const scopes = getEnabledSearchScopes(filters.searchScopes);
    if (scopes.includes("name") && matchesSearchTerms([hero.name, hero.class, hero.rarity, hero.type, ...(hero.typeSubtype ?? [])].join(" "), searchTerms)) {
      matches.push(`Hero: ${hero.name} · ${hero.class ?? "Unknown class"} · ${hero.rarity ?? "Unknown rarity"}`);
    }
    if (scopes.includes("skills") && hero.skill?.description && matchesSearchTerms([hero.skill?.name, hero.skill?.description, hero.skill?.powerDescription, hero.skill?.durationDescription].join(" "), searchTerms)) {
      matches.push(`Skill: ${hero.skill.description}`);
    }
    if (scopes.includes("mastery") && hero.masteryDescription && matchesSearchTerms(hero.masteryDescription, searchTerms)) {
      matches.push(`Mastery: ${hero.masteryDescription}`);
    }
    if (scopes.includes("milestones")) {
      matches.push(...(hero.milestones ?? [])
        .filter((milestone) => matchesSearchTerms([milestone.name, milestone.type, milestone.scope, milestone.description].join(" "), searchTerms))
        .map((milestone) => `Milestone ${milestone.milestone}: ${milestone.description}`));
    }
    if (scopes.includes("synergies")) {
      matches.push(...(hero.synergies ?? [])
        .filter((synergy) => matchesSearchTerms([synergy.name, synergy.type, synergy.scope, synergy.description, synergy.hero1, synergy.hero2].join(" "), searchTerms))
        .map((synergy) => formatSynergyMatchDetail(synergy, searchTerms)));
    }
  }

  if (filters.subtypeFilters.length) {
    const keywords = [...new Set(filters.subtypeFilters.flatMap((subtype) => getSubtypeKeywords(subtype)))];
    const matchingLines = [
      hero.skill?.description ? `Skill: ${hero.skill.description}` : null,
      hero.masteryDescription ? `Mastery: ${hero.masteryDescription}` : null,
      ...(hero.milestones ?? []).map((milestone) => `Milestone ${milestone.milestone}: ${milestone.description}`),
      ...(hero.synergies ?? []).map((synergy) => `${synergy.name}: ${synergy.description}`),
    ].filter(Boolean).filter((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)));

    matches.push(...matchingLines);
  }

  if (filters.milestoneTypeFilters.length) {
    matches.push(...(hero.milestones ?? [])
      .filter((milestone) => filters.milestoneTypeFilters.includes(milestone.type))
      .map((milestone) => `Milestone ${milestone.milestone}: ${milestone.description}`));
  }

  if (filters.synergyTypeFilters.length) {
    matches.push(...(hero.synergies ?? [])
      .filter((synergy) => filters.synergyTypeFilters.includes(synergy.type))
      .map((synergy) => `${synergy.name}: ${synergy.description}`));
  }

  return [...new Set(matches)];
}

function raritySortValue(rarity) {
  const index = RARITY_SORT_ORDER.indexOf(rarity);
  return index === -1 ? RARITY_SORT_ORDER.length : index;
}

function sortHeroes(heroes, mode) {
  const nextHeroes = [...heroes];

  nextHeroes.sort((left, right) => {
    if (mode === "name") {
      return left.name.localeCompare(right.name);
    }

    if (mode === "class") {
      return `${left.class ?? ""}${left.name}`.localeCompare(`${right.class ?? ""}${right.name}`);
    }

    if (mode === "rarity") {
      return raritySortValue(left.rarity) - raritySortValue(right.rarity) || left.name.localeCompare(right.name);
    }

    if (mode === "type") {
      return `${left.type ?? ""}${left.name}`.localeCompare(`${right.type ?? ""}${right.name}`);
    }

    return (left.order ?? 0) - (right.order ?? 0) || left.name.localeCompare(right.name);
  });

  return nextHeroes;
}

function getHeroPlacementCount(placements, heroId) {
  return Object.values(placements).filter((placedHeroId) => placedHeroId === heroId).length;
}

function getHeroCardDetails(hero, filters, placementCount) {
  const details = [];

  details.push(...collectDetailMatches(hero, filters).slice(0, 3));

  if (filters.classFilters.length) {
    details.push(`Class: ${hero.class ?? "Unknown"}`);
  }

  if (filters.rarityFilters.length) {
    details.push(`Rarity: ${hero.rarity ?? "Unknown"}`);
  }

  if (filters.typeFilters.length) {
    details.push(`Type: ${formatFilterLabel(hero.type)}`);
  }

  if (filters.subtypeFilters.length) {
    const matchingSubtypes = (hero.typeSubtype ?? []).filter((subtype) => filters.subtypeFilters.includes(subtype));
    if (matchingSubtypes.length) {
      details.push(`${hero.type === "debuff" ? "Debuff" : "Buff"}: ${matchingSubtypes.map(formatFilterLabel).join(", ")}`);
    }
  }

  if (filters.placementFilter !== "all") {
    details.push(`On Map: ${placementCount}/${MAX_DUPLICATE_HEROES}`);
  }

  if (!details.length) {
    details.push(hero.skill?.name ? `${hero.skill.name}: ${hero.skill.description}` : hero.masteryDescription ?? "No skill description available.");
  }

  return [...new Set(details)].slice(0, 3);
}

function getHeroSelectorStatHighlights(hero) {
  const preferredKeys = ["damage", "attackSpeed", "range", "skillCooldown", "critChance", "critDamage"];
  const displayStats = hero.upgradeDisplayStats ?? [];

  return preferredKeys
    .map((key) => displayStats.find((stat) => stat.key === key))
    .filter(Boolean)
    .slice(0, 4);
}

function FilterTabButton({ active, label, onClick, colors }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(245,146,30,0.18)" : colors.header,
        color: active ? colors.text : colors.muted,
        border: `1px solid ${active ? colors.accent : colors.border}`,
        borderRadius: 999,
        padding: "8px 12px",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function FilterSubTabButton({ active, label, onClick, colors }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(68,136,238,0.18)" : "transparent",
        color: active ? colors.text : colors.muted,
        border: `1px solid ${active ? colors.accent : colors.border}`,
        borderRadius: 999,
        padding: "6px 10px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function FilterChip({ active, label, onClick, colors }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(68,136,238,0.18)" : colors.header,
        color: active ? colors.text : colors.muted,
        border: `1px solid ${active ? colors.accent : colors.border}`,
        borderRadius: 999,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function FilterChipGroup({ title, options, selected, onToggle, colors, emptyLabel = "No options available." }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</div>
      {options.length ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {options.map((option) => (
            <FilterChip
              key={option}
              active={selected.includes(option)}
              label={formatFilterLabel(option)}
              onClick={() => onToggle(option)}
              colors={colors}
            />
          ))}
        </div>
      ) : (
        <div style={{ color: colors.muted, fontSize: 12 }}>{emptyLabel}</div>
      )}
    </div>
  );
}

function HeroSelectorCard({ hero, colors, getIconUrl, isSelected, isDisabled, placementCount, details, statHighlights, onSelect, onInspect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onInspect(hero.id)}
      disabled={isDisabled}
      style={{
        width: "100%",
        background: isSelected ? "rgba(245,146,30,0.18)" : colors.header,
        border: `1px solid ${isSelected ? colors.accent : colors.border}`,
        borderRadius: 12,
        padding: 10,
        display: "grid",
        gap: 10,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        boxShadow: isSelected ? "0 0 0 3px rgba(245,146,30,0.16)" : "none",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <HeroToken hero={hero} getIconUrl={getIconUrl} colors={colors} size={44} label={hero.name} />
        <div style={{ minWidth: 0, flex: 1, display: "grid", gap: 3 }}>
          <div style={{ fontWeight: 800, color: colors.text, fontSize: 13 }}>{hero.name}</div>
          <div style={{ fontSize: 11, color: colors.muted }}>{hero.class ?? "Unknown class"} · {hero.rarity ?? "Unknown rarity"}</div>
          <div style={{ fontSize: 11, color: colors.muted }}>{formatFilterLabel(hero.type)}{hero.typeSubtype?.length ? ` · ${hero.typeSubtype.map(formatFilterLabel).join(", ")}` : ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: placementCount >= MAX_DUPLICATE_HEROES ? "#ff8c8c" : colors.muted }}>
            {placementCount}/{MAX_DUPLICATE_HEROES}
          </div>
          <div style={{ fontSize: 10, color: colors.muted }}>On Map</div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {details.map((detail, index) => (
          <div key={`${hero.id}-detail-${index}`} style={{ fontSize: 11, color: colors.muted, lineHeight: 1.5 }}>
            {detail}
          </div>
        ))}
      </div>
      {statHighlights.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {statHighlights.map((stat) => (
            <span
              key={`${hero.id}-${stat.key}`}
              style={{
                background: "rgba(68,136,238,0.14)",
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                color: colors.text,
                fontSize: 10,
                fontWeight: 700,
                padding: "4px 7px",
                whiteSpace: "nowrap",
              }}
            >
              {stat.label}: {stat.value}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function DroppableSpot({ spot, size, onClick }) {
  const { setNodeRef } = useDroppable({
    id: `spot:${spot.id}`,
    data: { type: "spot", spotId: spot.id },
  });
  const hitSize = Math.max(size * 2, 40);

  return (
    <OverlayAnchor x={spot.x} y={spot.y} zIndex={4}>
      <div ref={setNodeRef} style={{ position: "relative" }}>
        <button
          type="button"
          aria-label={`Place hero on ${spot.label}`}
          onClick={onClick}
          style={{
            width: hitSize,
            height: hitSize,
            background: "transparent",
            border: "none",
            borderRadius: "50%",
            padding: 0,
            cursor: "pointer",
          }}
        />
      </div>
    </OverlayAnchor>
  );
}

function PlacedHeroToken({ hero, spot, colors, getIconUrl, size, onSelect, onInspect, onHoverStart, onHoverEnd }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `placed:${spot.id}`,
    data: { type: "placed-hero", heroId: hero.id, sourceSpotId: spot.id },
  });

  return (
    <OverlayAnchor
      x={spot.x}
      y={spot.y}
      zIndex={6}
      nodeRef={setNodeRef}
      style={{
        transform: `translate(-50%, -50%)${transform ? ` translate3d(${transform.x}px, ${transform.y}px, 0)` : ""}`,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(hero.id, spot.id)}
        onMouseEnter={() => {
          onInspect(hero.id);
          onHoverStart?.(spot.id);
        }}
        onMouseLeave={() => onHoverEnd?.(spot.id)}
        title={`Move ${hero.name}`}
        style={{ background: "transparent", border: "none", padding: 0, cursor: "grab" }}
        {...listeners}
        {...attributes}
      >
        <HeroToken hero={hero} getIconUrl={getIconUrl} colors={colors} size={size} label={hero.name} />
      </button>
    </OverlayAnchor>
  );
}

function FocusedHeroPreview({ hero, colors, getIconUrl }) {
  const imageSrc = hero?.heroIcon ? getIconUrl(hero.heroIcon) : null;

  return (
    <div style={{ width: 72, height: 72, borderRadius: 14, overflow: "hidden", background: colors.header, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 6 }}>
      {imageSrc ? (
        <img src={imageSrc} alt={hero?.name ?? "Hero"} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <span style={{ color: colors.text, fontWeight: 800 }}>{(hero?.name ?? "?").slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}

function FocusedHeroDetailSection({ title, subtitle, colors, children }) {
  return (
    <div style={{ background: colors.header, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 12, display: "grid", gap: 10 }}>
      <div>
        <div style={{ fontSize: 11, color: colors.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

function FocusedHeroMetaItem({ label, value, colors }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 10, color: colors.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

function FocusedHeroMilestoneCard({ milestone, colors }) {
  return (
    <div style={{ background: "rgba(8,17,26,0.26)", borderRadius: 10, border: `1px solid ${colors.border}`, padding: 10, display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: colors.text }}>Milestone {milestone.milestone}: {milestone.name}</div>
          <div style={{ fontSize: 11, color: colors.muted }}>Requirement {milestone.requirement} · {formatFilterLabel(milestone.scope)}</div>
        </div>
        <div style={{ fontSize: 11, color: colors.accent, fontWeight: 800 }}>{formatFilterLabel(milestone.type)}</div>
      </div>
      <div style={{ fontSize: 12, color: colors.text, lineHeight: 1.5 }}>{milestone.description}</div>
    </div>
  );
}

function FocusedHeroSynergyCard({ synergy, colors }) {
  return (
    <div style={{ background: "rgba(8,17,26,0.26)", borderRadius: 10, border: `1px solid ${colors.border}`, padding: 10, display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: colors.text }}>{synergy.name} · Tier {synergy.tier}</div>
          <div style={{ fontSize: 11, color: colors.muted }}>Level {synergy.synergyLevel} · Rank {synergy.rankRequired} · {formatFilterLabel(synergy.scope)}</div>
        </div>
        <div style={{ fontSize: 11, color: colors.accent, fontWeight: 800 }}>{formatFilterLabel(synergy.type)}</div>
      </div>
      <div style={{ fontSize: 12, color: colors.text, lineHeight: 1.5 }}>{synergy.description}</div>
      <div style={{ fontSize: 11, color: colors.muted }}>
        Partners: {[synergy.hero1, synergy.hero2].filter(Boolean).map(formatFilterLabel).join(" + ") || "Solo"}
      </div>
    </div>
  );
}

export function LoadoutBuilderPage({ colors, getIconUrl, maps, heroes, onNavigate }) {
  const statsLoadoutState = useMemo(() => readStatsLoadoutState(localStorage), []);
  const [builderMode, setBuilderMode] = useState(() => readMapLoadoutBuilderMode(localStorage));
  const [selectedMapId, setSelectedMapId] = useState(() => localStorage.getItem(LOADOUT_BUILDER_SELECTED_MAP_STORAGE_KEY) ?? maps[0]?.id ?? "");
  const mapLoadoutState = useMemo(() => readMapLoadoutState(localStorage), [builderMode, selectedMapId]);
  const [placementsByMap, setPlacementsByMap] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOADOUT_BUILDER_PLACEMENTS_STORAGE_KEY) ?? "null");
      return normalizePlacementsByMap(maps, parsed);
    } catch {
      return normalizePlacementsByMap(maps, {});
    }
  });
  const [searchValue, setSearchValue] = useState("");
  const [searchScopes, setSearchScopes] = useState({
    name: true,
    skills: true,
    mastery: true,
    milestones: true,
    synergies: true,
  });
  const [placementFilter, setPlacementFilter] = useState("all");
  const [sortMode, setSortMode] = useState("order");
  const [classFilters, setClassFilters] = useState([]);
  const [rarityFilters, setRarityFilters] = useState([]);
  const [typeFilters, setTypeFilters] = useState([]);
  const [subtypeFilters, setSubtypeFilters] = useState([]);
  const [milestoneTypeFilters, setMilestoneTypeFilters] = useState([]);
  const [synergyTypeFilters, setSynergyTypeFilters] = useState([]);
  const [selectedHeroAction, setSelectedHeroAction] = useState(null);
  const [inspectedHeroId, setInspectedHeroId] = useState(heroes[0]?.id ?? null);
  const [inspectedHeroSpotId, setInspectedHeroSpotId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("search");
  const [activeFilterSubtabs, setActiveFilterSubtabs] = useState(DEFAULT_FILTER_SUBTABS);
  const [isFocusedHeroExpanded, setIsFocusedHeroExpanded] = useState(false);
  const [activeFocusedHeroInfoTab, setActiveFocusedHeroInfoTab] = useState("skill");
  const [hoveredMapHeroSpotId, setHoveredMapHeroSpotId] = useState(null);

  const deferredSearch = useDeferredValue(searchValue);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const selectedMap = useMemo(
    () => maps.find((map) => map.id === selectedMapId) ?? maps[0] ?? null,
    [maps, selectedMapId]
  );
  const statsLoadoutBonuses = useMemo(
    () => getStatsLoadoutBonusTotals(statsLoadoutState.levelsByTab),
    [statsLoadoutState.levelsByTab]
  );
  const selectedMapPerkState = selectedMap ? (mapLoadoutState.perksByMap[selectedMap.id] ?? {}) : {};
  const selectedMapPlacementBonuses = selectedMap ? (mapLoadoutState.placementBonusPlacementsByMap[selectedMap.id] ?? {}) : {};
  const selectedMapGlobalBonuses = useMemo(() => {
    const totals = {};

    (selectedMap?.perks ?? []).forEach((perk) => {
      const perkState = selectedMapPerkState[perk.id];
      if (!perkState?.equipped) {
        return;
      }

      addBonusTotal(totals, inferMapPerkBonusKey(perk), getPerkCurrentBonus(perk, perkState.level ?? 0));
    });

    if (selectedMap?.negativePerk) {
      addBonusTotal(
        totals,
        normalizeMapPlacementBonusKey(selectedMap.negativePerk.statKey),
        selectedMap.negativePerk.statAmt
      );
    }

    return totals;
  }, [selectedMap, selectedMapPerkState]);

  const upgradedHeroes = useMemo(
    () => heroes.map((hero) => {
      const upgradeStats = buildHeroUpgradeStats(hero, mergeBonusTotals(statsLoadoutBonuses, selectedMapGlobalBonuses));
      return {
        ...hero,
        baseStats: upgradeStats.adjustedBaseStats,
        upgradeDisplayStats: upgradeStats.displayStats,
        skill: upgradeStats.adjustedSkill,
      };
    }),
    [heroes, selectedMapGlobalBonuses, statsLoadoutBonuses]
  );

  useEffect(() => {
    if (!selectedMap) {
      return;
    }
    setPlacementsByMap((current) => normalizePlacementsByMap(maps, current));
  }, [maps, selectedMap]);

  useEffect(() => {
    if (selectedMap?.id) {
      localStorage.setItem(LOADOUT_BUILDER_SELECTED_MAP_STORAGE_KEY, selectedMap.id);
    }
  }, [selectedMap]);

  useEffect(() => {
    writeMapLoadoutBuilderMode(builderMode, localStorage);
  }, [builderMode]);

  useEffect(() => {
    localStorage.setItem(LOADOUT_BUILDER_PLACEMENTS_STORAGE_KEY, JSON.stringify(placementsByMap));
  }, [placementsByMap]);

  useEffect(() => {
    if (builderMode !== "hero") {
      setSelectedHeroAction(null);
      setHoveredMapHeroSpotId(null);
    }
  }, [builderMode]);

  useEffect(() => {
    const hasSubtypeType = typeFilters.some((type) => type === "buff" || type === "debuff");
    if (!hasSubtypeType && subtypeFilters.length) {
      setSubtypeFilters([]);
    }
  }, [typeFilters, subtypeFilters]);

  useEffect(() => {
    const supportsSubtype = typeFilters.some((type) => type === "buff" || type === "debuff");
    if (!supportsSubtype && activeFilterSubtabs.effects === "subtype") {
      setActiveFilterSubtabs((current) => ({ ...current, effects: "type" }));
    }
  }, [typeFilters, activeFilterSubtabs.effects]);

  const placementBonusDefinitionsById = useMemo(
    () => Object.fromEntries((mapsData.placementBonuses ?? []).map((bonus) => [bonus.id, bonus])),
    []
  );
  const placements = selectedMap ? placementsByMap[selectedMap.id] ?? buildPlacementState(selectedMap.spots) : {};
  const heroSearchIndex = useMemo(
    () => Object.fromEntries(upgradedHeroes.map((hero) => [hero.id, buildHeroSearchIndex(hero)])),
    [upgradedHeroes]
  );
  const heroPlacementCounts = useMemo(
    () => Object.values(placements).reduce((counts, heroId) => {
      if (heroId) {
        counts[heroId] = (counts[heroId] ?? 0) + 1;
      }
      return counts;
    }, {}),
    [placements]
  );

  const classOptions = useMemo(() => [...new Set(upgradedHeroes.map((hero) => hero.class).filter(Boolean))], [upgradedHeroes]);
  const rarityOptions = useMemo(() => [...new Set(upgradedHeroes.map((hero) => hero.rarity).filter(Boolean))], [upgradedHeroes]);
  const typeOptions = useMemo(() => [...new Set(upgradedHeroes.map((hero) => hero.type).filter(Boolean))], [upgradedHeroes]);
  const milestoneTypeOptions = useMemo(
    () => [...new Set(upgradedHeroes.flatMap((hero) => (hero.milestones ?? []).map((milestone) => milestone.type)).filter(Boolean))],
    [upgradedHeroes]
  );
  const synergyTypeOptions = useMemo(
    () => [...new Set(upgradedHeroes.flatMap((hero) => (hero.synergies ?? []).map((synergy) => synergy.type)).filter(Boolean))],
    [upgradedHeroes]
  );
  const subtypeOptions = useMemo(() => {
    const relevantTypes = typeFilters.filter((type) => type === "buff" || type === "debuff");
    if (!relevantTypes.length) {
      return [];
    }

    return [...new Set(
      upgradedHeroes
        .filter((hero) => relevantTypes.includes(hero.type))
        .flatMap((hero) => hero.typeSubtype ?? [])
        .filter(Boolean)
    )];
  }, [upgradedHeroes, typeFilters]);

  const filteredHeroes = useMemo(() => {
    const normalizedQuery = deferredSearch.trim().toLowerCase();
    const searchTerms = deferredSearch
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const enabledSearchScopes = getEnabledSearchScopes(searchScopes);
    const shouldRestrictToExactNameMatches = searchScopes.name && Object.entries(searchScopes).every(([scope, isEnabled]) => scope === "name" ? isEnabled : !isEnabled);
    const exactNameMatches = shouldRestrictToExactNameMatches && normalizedQuery
      ? new Set(
        upgradedHeroes
          .filter((hero) => {
            const normalizedName = normalizeText(hero.name);
            const normalizedId = normalizeText(hero.id);
            return normalizedName === normalizedQuery || normalizedId === normalizedQuery;
          })
          .map((hero) => hero.id)
      )
      : null;

    const nextHeroes = upgradedHeroes.filter((hero) => {
      const matchesSearch = !searchTerms.length || searchTerms.every((term) => enabledSearchScopes.some((scope) => heroSearchIndex[hero.id]?.[scope]?.includes(term)));
      const matchesExactName = !exactNameMatches?.size || exactNameMatches.has(hero.id);
      const placementCount = heroPlacementCounts[hero.id] ?? 0;
      const matchesPlacement = placementFilter === "all"
        || (placementFilter === "available" && placementCount < MAX_DUPLICATE_HEROES)
        || (placementFilter === "placed" && placementCount > 0);
      const matchesClass = !classFilters.length || classFilters.includes(hero.class);
      const matchesRarity = !rarityFilters.length || rarityFilters.includes(hero.rarity);
      const matchesType = !typeFilters.length || typeFilters.includes(hero.type);
      const matchesSubtype = !subtypeFilters.length || (hero.typeSubtype ?? []).some((subtype) => subtypeFilters.includes(subtype));
      const matchesMilestones = !milestoneTypeFilters.length || (hero.milestones ?? []).some((milestone) => milestoneTypeFilters.includes(milestone.type));
      const matchesSynergies = !synergyTypeFilters.length || (hero.synergies ?? []).some((synergy) => synergyTypeFilters.includes(synergy.type));

      return matchesSearch && matchesExactName && matchesPlacement && matchesClass && matchesRarity && matchesType && matchesSubtype && matchesMilestones && matchesSynergies;
    });

    return sortHeroes(nextHeroes, sortMode);
  }, [upgradedHeroes, deferredSearch, heroSearchIndex, heroPlacementCounts, placementFilter, classFilters, rarityFilters, typeFilters, subtypeFilters, milestoneTypeFilters, synergyTypeFilters, sortMode, searchScopes]);

  const placedEntries = useMemo(
    () => Object.entries(placements)
      .filter(([, heroId]) => heroId)
      .map(([spotId, heroId]) => ({
        spotId,
        heroId,
        hero: (() => {
          const baseHero = heroes.find((item) => item.id === heroId);
          if (!baseHero) {
            return null;
          }

          const placedBonusId = selectedMapPlacementBonuses[spotId];
          const placedBonus = placementBonusDefinitionsById[placedBonusId] ?? null;
          const placementTotals = {};

          if (placedBonus) {
            addBonusTotal(
              placementTotals,
              normalizeMapPlacementBonusKey(placedBonus.statKey),
              getPlacementBonusValue(placedBonus, mapLoadoutState.placementBonusLevels[placedBonus.id] ?? 0)
            );
          }

          const bonusTotals = mergeBonusTotals(statsLoadoutBonuses, selectedMapGlobalBonuses, placementTotals);
          const upgradeStats = buildHeroUpgradeStats(baseHero, bonusTotals);

          return {
            ...baseHero,
            baseStats: upgradeStats.adjustedBaseStats,
            upgradeDisplayStats: upgradeStats.displayStats,
            skill: upgradeStats.adjustedSkill,
          };
        })(),
        spot: selectedMap?.spots.find((item) => item.id === spotId),
      }))
      .filter((entry) => entry.hero && entry.spot),
    [heroes, mapLoadoutState.placementBonusLevels, placementBonusDefinitionsById, placements, selectedMap, selectedMapGlobalBonuses, selectedMapPlacementBonuses, statsLoadoutBonuses]
  );
  const focusedHero = placedEntries.find((entry) => entry.spotId === inspectedHeroSpotId)?.hero
    ?? upgradedHeroes.find((hero) => hero.id === inspectedHeroId)
    ?? null;

  const filterContext = {
    searchValue,
    searchScopes,
    placementFilter,
    classFilters,
    rarityFilters,
    typeFilters,
    subtypeFilters,
    milestoneTypeFilters,
    synergyTypeFilters,
  };

  const hoveredMapHeroEntry = useMemo(
    () => placedEntries.find((entry) => entry.spotId === hoveredMapHeroSpotId) ?? null,
    [hoveredMapHeroSpotId, placedEntries]
  );

  function updatePlacements(updater) {
    if (!selectedMap) {
      return;
    }
    setPlacementsByMap((current) => ({
      ...current,
      [selectedMap.id]: updater(buildPlacementState(selectedMap.spots, current[selectedMap.id])),
    }));
  }

  function canAddAnotherHeroCopy(heroId, targetSpotId) {
    const placementCount = heroPlacementCounts[heroId] ?? 0;
    if (placementCount < MAX_DUPLICATE_HEROES) {
      return true;
    }

    return placements[targetSpotId] === heroId;
  }

  function placeHero(heroId, targetSpotId, sourceSpotId = null) {
    if (!selectedMap) {
      return;
    }

    if (!sourceSpotId && !canAddAnotherHeroCopy(heroId, targetSpotId)) {
      return;
    }

    updatePlacements((current) => {
      const next = { ...current };
      const targetHeroId = next[targetSpotId];

      if (sourceSpotId) {
        if (sourceSpotId === targetSpotId) {
          return next;
        }

        next[sourceSpotId] = targetHeroId ?? null;
        next[targetSpotId] = heroId;
        return next;
      }

      next[targetSpotId] = heroId;
      return next;
    });
  }

  function clearSpot(spotId) {
    if (inspectedHeroSpotId === spotId) {
      setInspectedHeroSpotId(null);
    }
    updatePlacements((current) => ({ ...current, [spotId]: null }));
  }

  function clearSelectedMap() {
    updatePlacements((current) => Object.fromEntries(Object.keys(current).map((spotId) => [spotId, null])));
    setSelectedHeroAction(null);
    setHoveredMapHeroSpotId(null);
    setInspectedHeroSpotId(null);
  }

  function resetFilters() {
    setSearchValue("");
    setSearchScopes({
      name: true,
      skills: true,
      mastery: true,
      milestones: true,
      synergies: true,
    });
    setPlacementFilter("all");
    setSortMode("order");
    setClassFilters([]);
    setRarityFilters([]);
    setTypeFilters([]);
    setSubtypeFilters([]);
    setMilestoneTypeFilters([]);
    setSynergyTypeFilters([]);
  }

  function handleDragStart(event) {
    const data = event.active.data.current;
    if (!data) {
      return;
    }
    const hero = upgradedHeroes.find((item) => item.id === data.heroId) ?? null;
    setDragState({ ...data, hero });
    setInspectedHeroId(data.heroId);
    setInspectedHeroSpotId(data.sourceSpotId ?? null);
  }

  function handleDragCancel() {
    setDragState(null);
  }

  function handleDragEnd(event) {
    const activeData = event.active.data.current;
    const overData = event.over?.data.current;

    if (activeData?.type === "placed-hero" && overData?.type === "spot") {
      placeHero(activeData.heroId, overData.spotId, activeData.sourceSpotId);
      setSelectedHeroAction(null);
    }

    setDragState(null);
  }

  function handleSpotClick(spot) {
    if (selectedHeroAction) {
      placeHero(selectedHeroAction.heroId, spot.id, selectedHeroAction.sourceSpotId ?? null);
      setSelectedHeroAction(null);
      return;
    }

    const heroId = placements[spot.id];
    if (heroId) {
      setSelectedHeroAction({ heroId, sourceSpotId: spot.id });
      setInspectedHeroId(heroId);
      setInspectedHeroSpotId(spot.id);
    }
  }

  function handleHeroSelectorClick(hero) {
    const placementCount = heroPlacementCounts[hero.id] ?? 0;
    if (placementCount >= MAX_DUPLICATE_HEROES) {
      return;
    }

    setSelectedHeroAction({ heroId: hero.id, sourceSpotId: null });
    setInspectedHeroId(hero.id);
    setInspectedHeroSpotId(null);
  }

  const mapHasSpots = Boolean(selectedMap?.spots.length);
  const placedCount = placedEntries.length;
  const openCount = selectedMap ? selectedMap.spots.length - placedCount : 0;
  const effectSubtabs = typeFilters.some((type) => type === "buff" || type === "debuff")
    ? FILTER_SUBTABS.effects
    : FILTER_SUBTABS.effects.filter((subtab) => subtab.id !== "subtype");
  const visibleSubtabs = activeFilterTab === "effects" ? effectSubtabs : FILTER_SUBTABS[activeFilterTab];
  const activeSubtab = activeFilterSubtabs[activeFilterTab] ?? DEFAULT_FILTER_SUBTABS[activeFilterTab];

  function handlePlacedHeroHoverStart(spotId) {
    setHoveredMapHeroSpotId(spotId);
  }

  function handlePlacedHeroHoverEnd(spotId) {
    setHoveredMapHeroSpotId((current) => (current === spotId ? null : current));
  }

  function handleCurrentPlacementHoverStart(entry) {
    setHoveredMapHeroSpotId(entry.spotId);
    setInspectedHeroId(entry.heroId);
    setInspectedHeroSpotId(entry.spotId);
  }

  function handleCurrentPlacementHoverEnd(spotId) {
    setHoveredMapHeroSpotId((current) => (current === spotId ? null : current));
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{
            display: "grid",
            gap: 14,
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            padding: 14,
          }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "stretch" }}>
              <label style={{ display: "grid", gap: 6, color: colors.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 220 }}>
                Active Map
                <select value={selectedMap?.id ?? ""} onChange={(event) => setSelectedMapId(event.target.value)} style={{ minWidth: 220, background: "#0f2640", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10, padding: "10px 12px", font: "inherit" }}>
                  {maps.map((map) => (
                    <option key={map.id} value={map.id}>{map.name}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: "grid", gap: 6, color: colors.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", minWidth: 260 }}>
                Builder
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { id: "hero", label: "Hero Loadout" },
                    { id: "perks", label: "Map Perks Loadout" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setBuilderMode(mode.id)}
                      style={{
                        background: builderMode === mode.id ? "rgba(245,146,30,0.16)" : colors.header,
                        color: builderMode === mode.id ? colors.accent : colors.text,
                        border: `1px solid ${builderMode === mode.id ? colors.accent : colors.border}`,
                        borderRadius: 10,
                        padding: "10px 14px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginLeft: "auto", alignItems: "stretch" }}>
                {[
                  { label: "Placed", value: placedCount },
                  { label: "Open Spots", value: openCount },
                ].map((stat) => (
                  <div key={stat.label} style={{ padding: "10px 12px", background: colors.header, borderRadius: 10, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
                    <div style={{ fontSize: 10, color: colors.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{stat.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: colors.text, lineHeight: 1 }}>{stat.value}</div>
                  </div>
                ))}
                <button type="button" onClick={clearSelectedMap} style={{ background: colors.header, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer", minHeight: 44 }}>
                  Clear Map
                </button>
                <button type="button" onClick={() => setIsFiltersExpanded((current) => !current)} style={{ background: isFiltersExpanded ? "rgba(68,136,238,0.16)" : colors.header, color: colors.text, border: `1px solid ${isFiltersExpanded ? colors.accent : colors.border}`, borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer", minHeight: 44 }}>
                  Filters
                </button>
              </div>
            </div>
          </div>

          {builderMode === "hero" && isFiltersExpanded && (
            <div style={{ display: "grid", gap: 14, background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {FILTER_TABS.map((tab) => (
                      <FilterTabButton key={tab.id} active={activeFilterTab === tab.id} label={tab.label} onClick={() => setActiveFilterTab(tab.id)} colors={colors} />
                    ))}
                    <div style={{ marginLeft: "auto", color: colors.muted, fontSize: 12 }}>
                      {filteredHeroes.length} of {heroes.length} heroes
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {visibleSubtabs.map((subtab) => (
                      <FilterSubTabButton
                        key={subtab.id}
                        active={activeSubtab === subtab.id}
                        label={subtab.label}
                        onClick={() => setActiveFilterSubtabs((current) => ({ ...current, [activeFilterTab]: subtab.id }))}
                        colors={colors}
                      />
                    ))}
                  </div>

                  {activeFilterTab === "search" && activeSubtab === "query" && (
                    <div style={{ display: "grid", gap: 12 }}>
                      <label style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Search Heroes</label>
                      <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search names, skills, mastery, milestones, synergies" style={{ background: "#0f2640", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10, padding: "10px 12px", font: "inherit" }} />
                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Search In</div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {SEARCH_SCOPE_OPTIONS.map((option) => (
                            <label key={option.id} style={{ display: "flex", alignItems: "center", gap: 6, color: colors.text, fontSize: 12 }}>
                              <input type="checkbox" checked={searchScopes[option.id]} onChange={() => setSearchScopes((current) => ({ ...current, [option.id]: !current[option.id] }))} />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeFilterTab === "search" && activeSubtab === "state" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                      <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Availability</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {[
                            { value: "all", label: "All Heroes" },
                            { value: "available", label: "Available" },
                            { value: "placed", label: "Placed" },
                          ].map((option) => (
                            <FilterChip key={option.value} active={placementFilter === option.value} label={option.label} onClick={() => setPlacementFilter(option.value)} colors={colors} />
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        <label style={{ color: colors.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sort</label>
                        <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} style={{ background: "#0f2640", border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 10, padding: "10px 12px", font: "inherit" }}>
                          <option value="order">Default Order</option>
                          <option value="name">Name</option>
                          <option value="class">Class</option>
                          <option value="rarity">Rarity</option>
                          <option value="type">Hero Type</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeFilterTab === "identity" && activeSubtab === "class" && (
                    <FilterChipGroup title="Class" options={classOptions} selected={classFilters} onToggle={(value) => setClassFilters((current) => toggleSelection(current, value))} colors={colors} />
                  )}

                  {activeFilterTab === "identity" && activeSubtab === "rarity" && (
                    <FilterChipGroup title="Rarity" options={rarityOptions} selected={rarityFilters} onToggle={(value) => setRarityFilters((current) => toggleSelection(current, value))} colors={colors} />
                  )}

                  {activeFilterTab === "effects" && activeSubtab === "type" && (
                    <FilterChipGroup title="Hero Type" options={typeOptions} selected={typeFilters} onToggle={(value) => setTypeFilters((current) => toggleSelection(current, value))} colors={colors} />
                  )}

                  {activeFilterTab === "effects" && activeSubtab === "subtype" && (
                    <FilterChipGroup title="Buff / Debuff Subtype" options={subtypeOptions} selected={subtypeFilters} onToggle={(value) => setSubtypeFilters((current) => toggleSelection(current, value))} colors={colors} emptyLabel="Choose buff or debuff in the Type sub tab to unlock subtype filters." />
                  )}

                  {activeFilterTab === "progression" && activeSubtab === "milestones" && (
                    <FilterChipGroup title="Milestone Bonus Type" options={milestoneTypeOptions} selected={milestoneTypeFilters} onToggle={(value) => setMilestoneTypeFilters((current) => toggleSelection(current, value))} colors={colors} />
                  )}

                  {activeFilterTab === "progression" && activeSubtab === "synergies" && (
                    <FilterChipGroup title="Synergy Bonus Type" options={synergyTypeOptions} selected={synergyTypeFilters} onToggle={(value) => setSynergyTypeFilters((current) => toggleSelection(current, value))} colors={colors} />
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ color: colors.muted, fontSize: 12 }}>
                      Filters change both the hero list and the detail rows shown on each hero card.
                    </div>
                    <button type="button" onClick={resetFilters} style={{ background: colors.header, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Reset Filters</button>
                  </div>
            </div>
          )}

          {builderMode === "hero" ? (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 440px)", gap: 20, alignItems: "start" }}>
              <div style={{ display: "grid", gap: 14 }}>

              {selectedMap && (
                <div style={{ position: "relative" }}>
                  <MapStage map={selectedMap} colors={colors} getIconUrl={getIconUrl} minHeight={420}>
                    {({ width, height, tokenSize, spotSize }) => {
                      const hoveredCenter = hoveredMapHeroEntry?.spot ? getSpotPixelPoint(hoveredMapHeroEntry.spot, width, height) : null;
                      const hoveredRangeRadius = hoveredMapHeroEntry?.hero ? getRangeRadiusPx(hoveredMapHeroEntry.hero.baseStats?.range, width, height) : 0;
                      const inRangeSpotIds = hoveredCenter && hoveredRangeRadius > 0
                        ? new Set(
                          placedEntries
                            .filter((entry) => entry.spotId !== hoveredMapHeroEntry.spotId)
                            .filter((entry) => getDistanceBetweenPoints(hoveredCenter, getSpotPixelPoint(entry.spot, width, height)) <= hoveredRangeRadius)
                            .map((entry) => entry.spotId)
                        )
                        : new Set();

                      return (
                    <>
                      {selectedMap.spots.map((spot) => (
                        <DroppableSpot
                          key={spot.id}
                          spot={spot}
                          size={spotSize}
                          onClick={() => handleSpotClick(spot)}
                        />
                      ))}

                      {hoveredMapHeroEntry?.spot && hoveredRangeRadius > 0 && (
                        <OverlayAnchor x={hoveredMapHeroEntry.spot.x} y={hoveredMapHeroEntry.spot.y} zIndex={5} style={{ pointerEvents: "none" }}>
                          <div style={{
                            width: hoveredRangeRadius * 2,
                            height: hoveredRangeRadius * 2,
                            borderRadius: "50%",
                            border: "2px solid rgba(245,146,30,0.58)",
                            background: "rgba(245,146,30,0.08)",
                            boxShadow: "0 0 0 1px rgba(245,146,30,0.14), inset 0 0 28px rgba(245,146,30,0.08)",
                          }} />
                        </OverlayAnchor>
                      )}

                      {selectedMap.spots.map((spot) => {
                        const heroId = placements[spot.id];
                        const hero = upgradedHeroes.find((item) => item.id === heroId) ?? null;

                        return hero ? (
                          <div key={`token-group:${spot.id}`}>
                            {inRangeSpotIds.has(spot.id) && (
                              <OverlayAnchor x={spot.x} y={spot.y} zIndex={5} style={{ pointerEvents: "none" }}>
                                <div className="loadout-range-target-ring" style={{ width: tokenSize + 20, height: tokenSize + 20 }} />
                              </OverlayAnchor>
                            )}
                            <PlacedHeroToken
                              hero={hero}
                              spot={spot}
                              colors={colors}
                              getIconUrl={getIconUrl}
                              size={tokenSize}
                              onSelect={(heroId, sourceSpotId) => setSelectedHeroAction({ heroId, sourceSpotId })}
                              onInspect={(heroId) => {
                                setInspectedHeroId(heroId);
                                setInspectedHeroSpotId(spot.id);
                              }}
                              onHoverStart={handlePlacedHeroHoverStart}
                              onHoverEnd={handlePlacedHeroHoverEnd}
                            />
                          </div>
                        ) : null;
                      })}

                      {!mapHasSpots && (
                        <div style={{ position: "absolute", inset: 20, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                          <div style={{ maxWidth: 360, padding: 18, borderRadius: 14, background: "rgba(10,18,28,0.76)", border: `1px solid ${colors.border}`, textAlign: "center" }}>
                            <div style={{ fontWeight: 900, color: colors.text, marginBottom: 8 }}>No placement nodes yet</div>
                            <div style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6 }}>
                              Open the coordinate finder to author normalized spots for this map, then come back here to place heroes.
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                      );
                    }}
                  </MapStage>
                </div>
              )}

              {!mapHasSpots && (
                <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 16, display: "flex", gap: 14, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 800, color: colors.text }}>This map is still missing authored spots.</div>
                    <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>Use the coord finder to add nodes with normalized coordinates before building a loadout.</div>
                  </div>
                  <button type="button" onClick={() => onNavigate("coordFinder")} style={{ background: colors.accent, color: "#08111a", border: `1px solid ${colors.accent}`, borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Open Coord Finder</button>
                </div>
              )}

              <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 16, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 11, color: colors.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Current Placements</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: colors.text }}>{placedEntries.length} active placements</div>
                  </div>
                </div>
                {placedEntries.length ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    {placedEntries.map((entry) => (
                      <div
                        key={entry.spotId}
                        onMouseEnter={() => handleCurrentPlacementHoverStart(entry)}
                        onMouseLeave={() => handleCurrentPlacementHoverEnd(entry.spotId)}
                        style={{
                          background: hoveredMapHeroSpotId === entry.spotId ? "rgba(245,146,30,0.14)" : colors.header,
                          border: `1px solid ${hoveredMapHeroSpotId === entry.spotId ? colors.accent : colors.border}`,
                          borderRadius: 10,
                          padding: 10,
                          display: "grid",
                          gap: 10,
                          boxShadow: hoveredMapHeroSpotId === entry.spotId ? "0 0 0 2px rgba(245,146,30,0.12)" : "none",
                          transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <HeroToken hero={entry.hero} getIconUrl={getIconUrl} colors={colors} size={40} label={entry.hero.name} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 800, color: colors.text, fontSize: 13 }}>{entry.hero.name}</div>
                            <div style={{ fontSize: 11, color: colors.muted }}>{entry.spot.label} · {entry.spot.id}</div>
                          </div>
                        </div>
                        <button type="button" onClick={() => clearSpot(entry.spotId)} style={{ background: "transparent", color: colors.accent, border: `1px solid ${colors.border}`, borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>Remove</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: colors.muted, fontSize: 13 }}>No heroes placed on this map yet.</div>
                )}
              </div>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 16, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: colors.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Hero Selector</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: colors.text }}>Choose a Hero</div>
                  </div>
                  {selectedHeroAction?.sourceSpotId == null && selectedHeroAction?.heroId && (
                    <button type="button" onClick={() => setSelectedHeroAction(null)} style={{ background: colors.header, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Cancel Selection</button>
                  )}
                </div>

                <div style={{ display: "grid", gap: 8, maxHeight: 440, overflowY: "auto", paddingRight: 4 }}>
                  {filteredHeroes.length ? filteredHeroes.map((hero) => {
                    const placementCount = heroPlacementCounts[hero.id] ?? 0;
                    return (
                      <HeroSelectorCard
                        key={hero.id}
                        hero={hero}
                        colors={colors}
                        getIconUrl={getIconUrl}
                        isSelected={selectedHeroAction?.heroId === hero.id && selectedHeroAction?.sourceSpotId == null}
                        isDisabled={placementCount >= MAX_DUPLICATE_HEROES}
                        placementCount={placementCount}
                        details={getHeroCardDetails(hero, filterContext, placementCount)}
                        statHighlights={getHeroSelectorStatHighlights(hero)}
                        onSelect={() => handleHeroSelectorClick(hero)}
                        onInspect={(heroId) => {
                          setInspectedHeroId(heroId);
                          setInspectedHeroSpotId(null);
                        }}
                      />
                    );
                  }) : (
                    <div style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6 }}>
                      No heroes match the current search and filter combination.
                    </div>
                  )}
                </div>
                </div>

                <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 16, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: colors.muted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Focused Hero</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: colors.text }}>{focusedHero?.name ?? "No hero selected"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selectedHeroAction && (
                      <button type="button" onClick={() => setSelectedHeroAction(null)} style={{ background: colors.header, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Cancel Selection</button>
                    )}
                    {focusedHero && (
                      <button type="button" onClick={() => setIsFocusedHeroExpanded((current) => !current)} style={{ background: colors.header, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
                        {isFocusedHeroExpanded ? "Less Info" : "More Info"}
                      </button>
                    )}
                  </div>
                </div>

                {focusedHero ? (
                  <>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <FocusedHeroPreview hero={focusedHero} colors={colors} getIconUrl={getIconUrl} />
                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 12, color: colors.muted }}>{focusedHero.class ?? "Unknown class"} · {focusedHero.rarity ?? "Unknown rarity"}</div>
                        <div style={{ fontSize: 12, color: colors.muted }}>{formatFilterLabel(focusedHero.type)}{focusedHero.typeSubtype?.length ? ` · ${focusedHero.typeSubtype.map(formatFilterLabel).join(", ")}` : ""}</div>
                        <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.6 }}>{focusedHero.skill?.description ?? "No skill description available."}</div>
                      </div>
                    </div>
                    <div style={{ background: colors.header, borderRadius: 10, border: `1px solid ${colors.border}`, padding: 12, color: colors.muted, fontSize: 12, lineHeight: 1.6 }}>
                      <strong style={{ color: colors.text }}>Mastery:</strong> {focusedHero.masteryDescription ?? "No mastery description available."}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                      {(focusedHero.upgradeDisplayStats ?? []).map((stat) => (
                        <div key={stat.key} style={{ background: colors.header, borderRadius: 10, border: `1px solid ${colors.border}`, padding: 10, display: "grid", gap: 4 }}>
                          <div style={{ fontSize: 10, color: colors.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{stat.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: colors.text }}>{stat.value}</div>
                          {stat.bonusLabel ? <div style={{ fontSize: 11, color: colors.muted }}>{stat.bonusLabel}</div> : null}
                        </div>
                      ))}
                    </div>
                    {isFocusedHeroExpanded && (
                      <div style={{ display: "grid", gap: 12 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {FOCUSED_HERO_INFO_TABS.map((tab) => (
                            <FilterSubTabButton key={tab.id} active={activeFocusedHeroInfoTab === tab.id} label={tab.label} onClick={() => setActiveFocusedHeroInfoTab(tab.id)} colors={colors} />
                          ))}
                        </div>

                        {activeFocusedHeroInfoTab === "skill" && (
                          <FocusedHeroDetailSection
                            title="Skill"
                            subtitle={focusedHero.skill?.name ?? "No active skill recorded"}
                            colors={colors}
                          >
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                              <FocusedHeroMetaItem label="Cooldown" value={focusedHero.skill?.cooldown != null ? `${focusedHero.skill.cooldown}s` : "None"} colors={colors} />
                              <FocusedHeroMetaItem label="Type" value={formatFilterLabel(focusedHero.type)} colors={colors} />
                            </div>
                            <FocusedHeroMetaItem label="Description" value={focusedHero.skill?.description ?? "No skill description available."} colors={colors} />
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                              <FocusedHeroMetaItem label="Power Scaling" value={focusedHero.skill?.powerDescription ?? "No power scaling listed."} colors={colors} />
                              <FocusedHeroMetaItem label="Duration" value={focusedHero.skill?.durationDescription ?? "No duration listed."} colors={colors} />
                            </div>
                          </FocusedHeroDetailSection>
                        )}

                        {activeFocusedHeroInfoTab === "milestones" && (
                          <FocusedHeroDetailSection
                            title="Milestones"
                            subtitle={`${focusedHero.milestones?.length ?? 0} progression nodes`}
                            colors={colors}
                          >
                            <div style={{ display: "grid", gap: 8, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                              {(focusedHero.milestones ?? []).map((milestone) => (
                                <FocusedHeroMilestoneCard key={`${focusedHero.id}-milestone-${milestone.milestone}`} milestone={milestone} colors={colors} />
                              ))}
                            </div>
                          </FocusedHeroDetailSection>
                        )}

                        {activeFocusedHeroInfoTab === "synergies" && (
                          <FocusedHeroDetailSection
                            title="Synergies"
                            subtitle={`${focusedHero.synergies?.length ?? 0} synergy bonuses`}
                            colors={colors}
                          >
                            {(focusedHero.synergies ?? []).length ? (
                              <div style={{ display: "grid", gap: 8, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                                {focusedHero.synergies.map((synergy) => (
                                  <FocusedHeroSynergyCard key={`${focusedHero.id}-synergy-${synergy.synergyLevel}-${synergy.tier}`} synergy={synergy} colors={colors} />
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: colors.muted }}>No synergy data is available for this hero.</div>
                            )}
                          </FocusedHeroDetailSection>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: colors.muted, fontSize: 13 }}>Hover or select a hero to inspect details here.</div>
                )}
                </div>
              </div>
            </div>
          ) : (
            <MapPerksLoadoutBuilder
              colors={colors}
              selectedMap={selectedMap}
              maps={maps}
              getIconUrl={getIconUrl}
            />
          )}
        </div>

        <DragOverlay>
          {dragState?.hero ? <HeroToken hero={dragState.hero} getIconUrl={getIconUrl} colors={colors} size={58} label={dragState.hero.name} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}