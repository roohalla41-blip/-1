import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryGateway } from './memoryGateway.js';

test('financial posting records cannot be physically deleted and must be reversed', async () => {
  const gateway = createMemoryGateway({
    seed: {
      exchange: [{ id: 'ex-1', number: 'EX-1001', amount: 100, currency: 'AFN', status: 'قطعی' }],
    },
  });
  await assert.rejects(
    gateway.remove('exchange', 'ex-1'),
    (error) => error.code === 'REVERSAL_REQUIRED',
  );
  await assert.rejects(
    gateway.replaceAll('exchange', []),
    (error) => error.code === 'REVERSAL_REQUIRED',
  );
  assert.equal((await gateway.get('exchange', 'ex-1')).id, 'ex-1');
});

test('non-posting master records retain the supported removal workflow', async () => {
  const gateway = createMemoryGateway({
    seed: { customers: [{ id: 'customer-1', name: 'نمونه' }] },
  });
  assert.equal(await gateway.remove('customers', 'customer-1'), true);
  assert.equal(await gateway.get('customers', 'customer-1'), null);
});
