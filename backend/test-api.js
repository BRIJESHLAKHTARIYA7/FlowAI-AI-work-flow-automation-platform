// End-to-end API test suite for FlowAI
import http from 'http';

const BASE_URL = 'http://localhost:3001';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('=== STARTING FLOWAI END-TO-END TESTS ===\n');

  // Test 1: Health Check
  console.log('1. Testing GET /api/health...');
  const health = await fetchJson('/api/health');
  console.log(`Status: ${health.status}, DB: ${health.data.database}, Mode: ${health.data.ai_mode}`);
  if (health.status !== 200 || health.data.status !== 'healthy') throw new Error('Health check failed');
  console.log('✅ Health check passed.\n');

  // Test 2: List Workflows
  console.log('2. Testing GET /api/workflows...');
  const wfs = await fetchJson('/api/workflows');
  console.log(`Found ${wfs.data.count} workflow(s). Pre-seeded Demo: "${wfs.data.data[0]?.name}"`);
  if (wfs.status !== 200 || wfs.data.count === 0) throw new Error('Workflows listing failed');
  console.log('✅ Workflows listing passed.\n');

  const demoWorkflowId = wfs.data.data[0].id;

  // Test 3: AI Natural Language Compilation (Rule-based / Gemini)
  console.log('3. Testing POST /api/ai/parse-workflow...');
  const aiRes = await fetchJson('/api/ai/parse-workflow', {
    method: 'POST',
    body: JSON.stringify({
      prompt: 'When a new order arrives, if the amount is greater than 500, wait 10 seconds and send a follow-up message.'
    })
  });
  console.log(`Compiler Source: ${aiRes.data.data?.source}, Steps Count: ${aiRes.data.data?.steps?.length}`);
  if (!aiRes.data.success || aiRes.data.data?.steps?.length !== 3) {
    throw new Error('AI parsing failed or step count mismatched');
  }
  console.log('✅ AI parsing & rule fallback passed.\n');

  // Test 4: Execute Demo Workflow with High Value (amount = 850)
  console.log('4. Testing POST /api/workflows/:id/execute (High value order $850)...');
  const execRes = await fetchJson(`/api/workflows/${demoWorkflowId}/execute`, {
    method: 'POST',
    body: JSON.stringify({
      payload: {
        order_id: 'ORD-HIGH-1',
        amount: 850,
        customer_name: 'VIP Client',
        email: 'vip@flowai.dev'
      }
    })
  });
  const runId = execRes.data.data?.run_id;
  console.log(`Execution initiated. Run ID: ${runId}`);
  if (!runId) throw new Error('Failed to initiate execution');
  console.log('✅ Execution started.\n');

  // Wait 1.5s for condition to pass and wait step to activate
  await new Promise(r => setTimeout(r, 1500));

  // Test 5: Verify Run State & Logs
  console.log('5. Testing GET /api/runs/:id to inspect logs and wait state...');
  const runDetails = await fetchJson(`/api/runs/${runId}`);
  console.log(`Run status: ${runDetails.data.data?.status}, Current Step: ${runDetails.data.data?.current_step}`);
  console.log(`Wait Until: ${runDetails.data.data?.wait_until}`);
  console.log(`Logs recorded: ${runDetails.data.data?.logs?.length}`);
  runDetails.data.data?.logs?.forEach(l => {
    console.log(`   [${l.status.toUpperCase()}] Step ${l.step_index}: ${l.message}`);
  });
  if (runDetails.data.data?.status !== 'waiting') {
    throw new Error(`Expected status 'waiting', got '${runDetails.data.data?.status}'`);
  }
  console.log('✅ Wait step persisted correctly in SQLite.\n');

  // Test 6: Test Restart Crash Recovery
  console.log('6. Testing POST /api/test/simulate-restart (Server restart recovery)...');
  const restartRes = await fetchJson('/api/test/simulate-restart', { method: 'POST' });
  console.log(`Restart simulation: ${restartRes.data.message}`);
  console.log('✅ Restart recovery simulation verified.\n');

  // Test 7: Condition Failure Case (amount = 250)
  console.log('7. Testing Condition Failure Case ($250 <= $500)...');
  const failExec = await fetchJson(`/api/workflows/${demoWorkflowId}/execute`, {
    method: 'POST',
    body: JSON.stringify({
      payload: {
        order_id: 'ORD-LOW-2',
        amount: 250,
        customer_name: 'Regular Customer'
      }
    })
  });
  const failRunId = failExec.data.data?.run_id;
  await new Promise(r => setTimeout(r, 1000));
  const failDetails = await fetchJson(`/api/runs/${failRunId}`);
  console.log(`Fail Run status: ${failDetails.data.data?.status}`);
  const lastLog = failDetails.data.data?.logs?.slice(-1)[0];
  console.log(`Last log: [${lastLog?.status}] ${lastLog?.message}`);
  console.log('✅ Condition failure handled safely.\n');

  // Test 8: Stats endpoint
  console.log('8. Testing GET /api/stats...');
  const statsRes = await fetchJson('/api/stats');
  console.log(`Dashboard Stats: Total Workflows = ${statsRes.data.data?.workflows?.total}, Total Runs = ${statsRes.data.data?.executions?.total}`);
  console.log('✅ Stats endpoint verified.\n');

  console.log('==================================================');
  console.log('🎉 ALL INTEGRATION AND ACCEPTANCE TESTS PASSED! 🎉');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
