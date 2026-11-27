async function testFullFlow() {
  console.log('1. Triggering Demo Workflow...');
  const exec = await fetch('http://localhost:3001/api/workflows/demo-order-followup-1/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: { order_id: 'ORD-VIP-999', amount: 950, customer_name: 'VIP Client' } })
  }).then(r => r.json());
  
  const runId = exec.data.run_id;
  console.log('Started run:', runId);

  // Poll status every 2 seconds for up to 16 seconds
  for (let i = 1; i <= 8; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch('http://localhost:3001/api/runs/' + runId).then(r => r.json());
    const run = res.data;
    console.log(`[t=${i * 2}s] Status: ${run.status}, Current Step: ${run.current_step}, Logs: ${run.logs.length}, Deliveries: ${run.message_deliveries.length}`);
    if (run.status === 'completed') {
      console.log('\n✅ WORKFLOW COMPLETED FULLY!');
      console.log('All Logs:');
      run.logs.forEach(l => console.log(`  [${l.status.toUpperCase()}] Step ${l.step_index}: ${l.message}`));
      console.log('Delivery records:', run.message_deliveries);
      return;
    }
  }
}

testFullFlow().catch(console.error);
