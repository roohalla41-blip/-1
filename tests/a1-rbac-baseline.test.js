import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessRoute,
  getRoleLevel,
  getRoleLabel,
  normalizeRole,
} from '../src/lib/rbac.js';

// These tests freeze A1's current role/route behavior before any Preview RBAC
// code is considered for transfer. They are compatibility checks, not a new
// authorization policy.
test('A1 role catalogue and current legacy exchange behavior are recorded', () => {
  assert.equal(normalizeRole('exchange'), 'sarraaf');
  assert.equal(getRoleLevel('sarraaf'), 50);
  assert.equal(getRoleLevel('exchange'), 0);
  assert.equal(getRoleLabel('exchange'), 'کاربر');
  assert.equal(canAccessRoute('exchange', '/dashboard'), false);
});

test('A1 employee access currently includes bank and settings', () => {
  assert.equal(canAccessRoute('employee', '/cash'), true);
  assert.equal(canAccessRoute('employee', '/bank'), true);
  assert.equal(canAccessRoute('employee', '/settings'), true);
});

test('A1 customer routes remain isolated from exchanger dashboard routes', () => {
  assert.equal(canAccessRoute('customer', '/customer'), true);
  assert.equal(canAccessRoute('customer', '/customer/wallet'), true);
  assert.equal(canAccessRoute('customer', '/dashboard'), false);
});

test('A1 builder route matrix currently grants creator but not admin', () => {
  assert.equal(canAccessRoute('creator', '/builder'), true);
  assert.equal(canAccessRoute('admin', '/builder'), false);
});

test('A1 rejects unknown routes and unsupported transfer directions', () => {
  assert.equal(canAccessRoute('sarraaf', '/not-a-real-route'), false);
  assert.equal(canAccessRoute('employee', '/transfers/unsupported'), false);
});
