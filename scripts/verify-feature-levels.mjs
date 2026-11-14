// Dependency-free check for the three-tier feature gating in src/lib/features.js.
// Run:  node scripts/verify-feature-levels.mjs
import { visibleNavItems, planLevel } from '../src/lib/features.js';

let failed = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (got ${actual}, expected ${expected})`);
}

const FUTURE = '2999-01-01';
const PAST = '2000-01-01';
const items = [{ featureKey: 'customers' }];

function visible(flags, profile, paidSystemEnabled = true) {
  const rec = {
    feature_key: 'customers', status: 'active', enabled: true,
    free_enabled: true, paid_enabled: true,
    level_1_enabled: true, level_2_enabled: true, level_3_enabled: true,
    ...flags,
  };
  return visibleNavItems([rec], items, profile, paidSystemEnabled).length === 1 ? 'visible' : 'hidden';
}

// planLevel mapping
check('planLevel free', planLevel('free'), 1);
check('planLevel undefined -> free', planLevel(undefined), 1);
check('planLevel pro', planLevel('pro'), 2);
check('planLevel paid', planLevel('paid'), 2);
check('planLevel special', planLevel('special'), 3);
check('planLevel unknown -> null (no level restriction)', planLevel('weird'), null);

// 1) Current production data: every level flag is true => behaviour unchanged.
check('all flags true: free', visible({}, { plan: 'free' }), 'visible');
check('all flags true: pro active', visible({}, { plan: 'pro', paid_end_date: FUTURE }), 'visible');
check('all flags true: special active', visible({}, { plan: 'special', paid_end_date: FUTURE }), 'visible');
check('all flags true: pro expired', visible({}, { plan: 'pro', paid_end_date: PAST }), 'visible');

// 2) Level 1 off: free and expired-paid (falls back to free) hidden; paid levels visible.
check('L1 off: free hidden', visible({ level_1_enabled: false }, { plan: 'free' }), 'hidden');
check('L1 off: pro visible', visible({ level_1_enabled: false }, { plan: 'pro', paid_end_date: FUTURE }), 'visible');
check('L1 off: expired pro hidden', visible({ level_1_enabled: false }, { plan: 'pro', paid_end_date: PAST }), 'hidden');

// 3) Level 2 off.
check('L2 off: pro hidden', visible({ level_2_enabled: false }, { plan: 'pro', paid_end_date: FUTURE }), 'hidden');
check('L2 off: free visible', visible({ level_2_enabled: false }, { plan: 'free' }), 'visible');
check('L2 off: special visible', visible({ level_2_enabled: false }, { plan: 'special', paid_end_date: FUTURE }), 'visible');

// 4) Level 3 off.
check('L3 off: special hidden', visible({ level_3_enabled: false }, { plan: 'special', paid_end_date: FUTURE }), 'hidden');

// 5) Unknown paid plan is not level-restricted (backward compatible).
check('unknown plan ignores level flags', visible({ level_2_enabled: false, level_3_enabled: false }, { plan: 'weird', paid_end_date: FUTURE }), 'visible');

// 6) Legacy flags still honoured.
check('free_enabled off: free hidden', visible({ free_enabled: false }, { plan: 'free' }), 'hidden');
check('paid_enabled off: pro hidden', visible({ paid_enabled: false }, { plan: 'pro', paid_end_date: FUTURE }), 'hidden');

// 7) Paid system disabled => everyone sees everything.
check('paid system off: all visible', visible({ level_1_enabled: false, free_enabled: false }, { plan: 'free' }, false), 'visible');

console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
