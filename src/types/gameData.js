/**
 * @typedef {Object} HeroRecord
 * @property {string} id
 * @property {string} name
 * @property {number} heroId
 * @property {string} [class]
 * @property {string} [rarity]
 * @property {number} [order]
 * @property {string} [heroIcon]
 * @property {Record<string, unknown>} [skill]
 * @property {Record<string, number>} [baseStats]
 * @property {Array<Record<string, unknown>>} [milestones]
 */

/**
 * @typedef {Object} MapSpot
 * @property {string} id
 * @property {string} label
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} GameMapRecord
 * @property {string} id
 * @property {string} name
 * @property {number} mapId
 * @property {string} [icon]
 * @property {string} [image]
 * @property {number} [waveRequirement]
 * @property {number} [gemsToUnlock]
 * @property {Array<Record<string, unknown>>} [perks]
 * @property {MapSpot[]} spots
 */

/**
 * @typedef {Object} LoadoutPlacement
 * @property {string} heroId
 * @property {string} mapId
 * @property {string} spotId
 */

export {};