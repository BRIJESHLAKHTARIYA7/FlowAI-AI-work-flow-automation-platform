import express from 'express';
import db, { seedDemoWorkflow } from '../db.js';
import engine from '../engine.js';

const router = express.Router();

// GET /api/health - Engine & system health check
router.get('/health', (req, res) => {
  try {
    const dbCheck = db.prepare('SELECT 1 as alive').get();
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY');

    res.json({
      status: 'healthy',
      database: dbCheck.alive === 1 ? 'connected' : 'error',
      ai_mode: hasGeminiKey ? 'Gemini 1.5 Flash (API Key Configured)' : 'Rule-Based Fallback Engine (No Key Configured)',
      active_executions_in_memory: engine.activeRunPromises.size,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime())
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// GET /api/stats - Dashboard metrics
router.get('/stats', (req, res) => {
  try {
    const totalWorkflows = db.prepare('SELECT COUNT(*) as count FROM workflows').get().count;
    const activeWorkflows = db.prepare("SELECT COUNT(*) as count FROM workflows WHERE status = 'active'").get().count;

    const totalRuns = db.prepare('SELECT COUNT(*) as count FROM workflow_runs').get().count;
    const successfulRuns = db.prepare("SELECT COUNT(*) as count FROM workflow_runs WHERE status = 'completed'").get().count;
    const failedRuns = db.prepare("SELECT COUNT(*) as count FROM workflow_runs WHERE status = 'failed'").get().count;
    const waitingRuns = db.prepare("SELECT COUNT(*) as count FROM workflow_runs WHERE status = 'waiting'").get().count;
    const runningRuns = db.prepare("SELECT COUNT(*) as count FROM workflow_runs WHERE status = 'running'").get().count;

    const recentRuns = db.prepare(`
      SELECT 
        r.id,
        r.workflow_id,
        w.name as workflow_name,
        r.status,
        r.current_step,
        r.wait_until,
        r.created_at,
        r.updated_at
      FROM workflow_runs r
      LEFT JOIN workflows w ON r.workflow_id = w.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all();

    const recentMessages = db.prepare(`
      SELECT 
        m.id,
        m.run_id,
        m.idempotency_key,
        m.message,
        m.status,
        m.created_at
      FROM message_deliveries m
      ORDER BY m.created_at DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        workflows: {
          total: totalWorkflows,
          active: activeWorkflows,
          inactive: totalWorkflows - activeWorkflows
        },
        executions: {
          total: totalRuns,
          successful: successfulRuns,
          failed: failedRuns,
          waiting: waitingRuns,
          running: runningRuns,
          success_rate: totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100
        },
        recent_activity: recentRuns,
        recent_messages: recentMessages
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/test/simulate-restart - Triggers the engine's crash recovery scan
router.post('/test/simulate-restart', (req, res) => {
  try {
    console.log('[Test] Simulating server crash and running restart recovery...');
    engine.recoverUnfinishedRuns();

    res.json({
      success: true,
      message: 'Server restart recovery routine executed successfully. Unfinished and waiting runs evaluated.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/test/reset-demo - Re-seed the demo workflow
router.post('/test/reset-demo', (req, res) => {
  try {
    const existing = db.prepare("SELECT id FROM workflows WHERE id = 'demo-order-followup-1'").get();
    if (existing) {
      db.prepare("DELETE FROM workflows WHERE id = 'demo-order-followup-1'").run();
    }
    seedDemoWorkflow();

    res.json({
      success: true,
      message: 'Demo workflow re-seeded successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
