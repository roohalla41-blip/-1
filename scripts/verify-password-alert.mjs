// Dependency-free check for src/lib/passwordAlert.js.
// Run:  node scripts/verify-password-alert.mjs
import {
  isDefaultPasswordAccount,
  readDefaultPasswordAlert,
  DEFAULT_PASSWORD_ALERT_KEY,
} from '../src/lib/passwordAlert.js';

let failed = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
}
const store = (data) => ({ getItem: (k) => (k in data ? data[k] : null) });

// Which logins trigger the alert
check('exchange + default password', isDefaultPasswordAccount('12345678', 'exchange'), true);
check('sarraaf + default password', isDefaultPasswordAccount('12345678', 'sarraaf'), true);
check('customer + default password (previously not covered)', isDefaultPasswordAccount('12345678', 'customer'), true);
check('creator + default password never alerts', isDefaultPasswordAccount('12345678', 'creator'), false);
check('admin + default password never alerts', isDefaultPasswordAccount('12345678', 'admin'), false);
check('strong password does not alert', isDefaultPasswordAccount('Str0ng!pass', 'exchange'), false);
check('server flag alerts even when typed password differs', isDefaultPasswordAccount('x', 'customer', true), true);
check('server flag on creator still never alerts', isDefaultPasswordAccount('x', 'creator', true), false);

// What the banner reads from storage
const flag = DEFAULT_PASSWORD_ALERT_KEY;
check('flag set + customer user', readDefaultPasswordAlert(store({ [flag]: '1', auth_user: '{"role":"customer"}' })), { role: 'customer' });
check('flag set + exchange user', readDefaultPasswordAlert(store({ [flag]: '1', auth_user: '{"role":"exchange"}' })), { role: 'exchange' });
check('flag missing -> no banner', readDefaultPasswordAlert(store({ auth_user: '{"role":"exchange"}' })), null);
check('flag set but no user (creator is not stored) -> no banner', readDefaultPasswordAlert(store({ [flag]: '1' })), null);
check('flag set + creator user -> no banner', readDefaultPasswordAlert(store({ [flag]: '1', auth_user: '{"role":"creator"}' })), null);
check('corrupt auth_user json -> no banner, no throw', readDefaultPasswordAlert(store({ [flag]: '1', auth_user: '{bad' })), null);
check('null storage -> no banner, no throw', readDefaultPasswordAlert(null), null);

console.log(failed === 0 ? '\nALL CHECKS PASSED' : `\n${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
