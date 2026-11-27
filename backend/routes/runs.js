import express from 'express';
import db from '../db.js';
import engine from '../engine.js';

const router = express.Router();

// GET /api/runs - List workflow execution runs
router.get('/', (req, res) => {
  try {
    const { status, workflow_id, limit = 50 } = req.query;

    let query = `
      SELECT 
        r.*,
        w.name as workflow_name,
        w.steps_json
      FROM workflow_runs r
      LEFT JOIN workflows w ON r.workflow_id = w.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (workflow_id) {
      conditions.push('r.workflow_id = ?');
      params.push(workflow_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const runs = db.prepare(query).all(...params);

    const formatted = runs.map(run => {
      let totalSteps = 0;
      try {
        const steps = JSON.parse(run.steps_json || '[]');
        totalSteps = steps.length;
      } catch (e) {}

      return {
        id: run.id,
        workflow_id: run.workflow_id,
        workflow_name: run.workflow_name || 'Deleted Workflow',
        status: run.status,
        current_step: run.current_step,
        total_steps: totalSteps,
        wait_until: run.wait_until,
        input: JSON.parse(run.input_json || '{}'),
        created_at: run.created_at,
        updated_at: run.updated_at
      };
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/runs/:id - Get complete run details, logs, and message deliveries
router.get('/:id', (req, res) => {
  try {
    const run = db.prepare(`
      SELECT 
        r.*,
        w.name as workflow_name,
        w.steps_json,
        w.trigger_config
      FROM workflow_runs r
      LEFT JOIN workflows w ON r.workflow_id = w.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!run) {
      return res.status(404).json({ success: false, error: 'Workflow run not found.' });
    }

    const logs = db.prepare(`
      SELECT id, run_id, step_index, status, message, created_at
      FROM execution_logs
      WHERE run_id = ?
      ORDER BY id ASC
    `).all(req.params.id);

    const deliveries = db.prepare(`
      SELECT id, run_id, idempotency_key, message, status, created_at
      FROM message_deliveries
      WHERE run_id = ?
      ORDER BY id ASC
    `).all(req.params.id);

    let steps = [];
    try {
      steps = JSON.parse(run.steps_json || '[]');
    } catch (e) {}

    res.json({
      success: true,
      data: {
        id: run.id,
        workflow_id: run.workflow_id,
        workflow_name: run.workflow_name,
        status: run.status,
        current_step: run.current_step,
        total_steps: steps.length,
        steps,
        wait_until: run.wait_until,
        input: JSON.parse(run.input_json || '{}'),
        created_at: run.created_at,
        updated_at: run.updated_at,
        logs,
        message_deliveries: deliveries
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/runs/:id/retry - Retry run with same input
router.post('/:id/retry', async (req, res) => {
  try {
    const run = db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(req.params.id);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Run not found.' });
    }

    const inputPayload = JSON.parse(run.input_json || '{}');
    const newRunId = await engine.startRun(run.workflow_id, inputPayload);

    res.status(202).json({
      success: true,
      message: 'New execution started with previous run payload.',
      data: { run_id: newRunId }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
