import { genericScenarios } from './generic-scenarios.mjs';
import { humanspecScenarios } from './humanspec-scenarios.mjs';

export const QA_TIERS = Object.freeze(['fast', 'smoke', 'capstone']);
export const QA_PLATFORMS = Object.freeze(['linux', 'darwin', 'win32']);

/**
 * Stable, explicit scenario registry. Adding a scenario requires adding it to
 * one of these imports; the runner never discovers executable files by glob.
 */
export const SCENARIOS = Object.freeze([
  ...genericScenarios,
  ...humanspecScenarios,
]);

const SCENARIO_BY_ID = new Map(SCENARIOS.map((scenario) => [scenario.id, scenario]));

export function normalizePlatform(platform = process.platform) {
  if (platform === 'aix' || platform === 'freebsd' || platform === 'openbsd' || platform === 'sunos') return 'linux';
  return platform;
}

export function selectScenarios({ tier = 'smoke', ids = [], platform = process.platform } = {}) {
  const selectedPlatform = normalizePlatform(platform);
  if (!QA_TIERS.includes(tier)) throw new Error(`Unknown QA tier ${JSON.stringify(tier)}. Use ${QA_TIERS.join(', ')}.`);
  if (ids.length > 0) {
    return ids.map((id) => {
      const scenario = SCENARIO_BY_ID.get(id);
      if (!scenario) throw new Error(`Unknown QA scenario ${JSON.stringify(id)}.`);
      return scenario;
    }).filter((scenario) => scenario.platforms.includes(selectedPlatform));
  }
  return SCENARIOS.filter(
    (scenario) => scenario.tier.includes(tier) && scenario.platforms.includes(selectedPlatform)
  );
}

export function getScenario(id) {
  return SCENARIO_BY_ID.get(id);
}
