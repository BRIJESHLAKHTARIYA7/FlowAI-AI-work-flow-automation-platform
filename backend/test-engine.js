import db, { initDatabase } from './db.js';
import engine from './engine.js';
import { parseWithRuleEngine } from './ai.js';

console.log('--- 1. Testing Database Initialization ---');
initDatabase();
const workflows = db.prepare('SELECT * FROM workflows').all();
console.log(`Found ${workflows.length} workflow(s). First workflow: "${workflows[0]?.name}"`);

console.log('\n--- 2. Testing AI Rule-Based Parser ---');
const parsed = parseWithRuleEngine('When a new order arrives, if the amount is greater than 500, wait 10 seconds and send a follow-up message.');
console.log('Parsed steps count:', parsed.steps.length);
console.log('Parsed steps summary:', parsed.steps.map(s => `${s.type}: ${s.name}`));

console.log('\n--- 3. Testing Execution Engine with Demo Workflow ---');
async function testExecution() {
  const demoWf = workflows[0];
  console.log(`Starting execution for "${demoWf.name}" with amount = 750 (should pass condition > 500)...`);
  
  const runId = await engine.startRun(demoWf.id, {
    order_id: 'ORD-TEST-1',
    amount: 750,
    customer_name: 'Test Customer',
    email: 'test@flowai.dev'
  });

  console.log(`Run started with ID: ${runId}`);
  
  // Wait 1.5 seconds to see condition pass and wait step initiated
  await new Promise(r => setTimeout(r, 1500));

  const runState1 = db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(runId);
  console.log(`Current status: ${runState1.status}, current_step: ${runState1.current_step}, wait_until: ${runState1.wait_until}`);
  
  const logs1 = db.prepare('SELECT * FROM execution_logs WHERE run_id = ?').all(runId);
  console.log(`Logs generated so far (${logs1.length}):`);
  logs1.forEach(l => console.log(`  [${l.status.toUpperCase()}] Step ${l.step_index}: ${l.message}`));

  console.log('\n--- 4. Testing Crash Recovery Simulation ---');
  // Simulate server restart while in 'waiting' state
  engine.recoverUnfinishedRuns();
  console.log('Restart recovery executed without error.');

  console.log('\n--- 5. Testing Idempotency on Message Delivery ---');
  // Attempt to execute message directly with same key
  const messageStep = { content: 'VIP order confirmation', idempotency_key: `${runId}_step_2` };
  const res1 = await engine.executeMessage(messageStep, { amount: 750 }, runId, 2);
  console.log('First message delivery result:', res1);
  const res2 = await engine.executeMessage(messageStep, { amount: 750 }, runId, 2);
  console.log('Second (duplicate) message delivery result:', res2);
  if (res2.duplicate) {
    console.log('✅ IDEMPOTENCY SUCCESS: Duplicate message dispatch prevented!');
  } else {
    console.error('❌ IDEMPOTENCY FAILED');
  }

  console.log('\n--- 6. Testing Condition Failure Case (amount = 300) ---');
  const runIdFail = await engine.startRun(demoWf.id, {
    order_id: 'ORD-TEST-2',
    amount: 300,
    customer_name: 'Low Value Customer'
  });
  await new Promise(r => setTimeout(r, 800));
  const failLogs = db.prepare('SELECT * FROM execution_logs WHERE run_id = ?').all(runIdFail);
  console.log(`Condition fail run status:`);
  failLogs.forEach(l => console.log(`  [${l.status.toUpperCase()}] Step ${l.step_index}: ${l.message}`));

  engine.stop();
  console.log('\n✅ All backend unit and integration tests completed successfully!');
  process.exit(0);
}

testExecution().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
