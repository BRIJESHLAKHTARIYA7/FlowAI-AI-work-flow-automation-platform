import express from 'express';
import db from '../db.js';
import engine from '../engine.js';
import { validateWorkflowSteps } from '../ai.js';

const router = express.Router();

// GET /api/workflows - List all workflows with aggregate run metrics
router.get('/', (req, res) => {
  try {
    const workflows = db.prepare(`
      SELECT 
        w.*,
        (SELECT COUNT(*) FROM workflow_runs r WHERE r.workflow_id = w.id) as total_runs,
        (SELECT COUNT(*) FROM workflow_runs r WHERE r.workflow_id = w.id AND r.status = 'completed') as successful_runs,
        (SELECT COUNT(*) FROM workflow_runs r WHERE r.workflow_id = w.id AND r.status = 'failed') as failed_runs,
        (SELECT MAX(created_at) FROM workflow_runs r WHERE r.workflow_id = w.id) as last_run_at
      FROM workflows w
      ORDER BY w.updated_at DESC
    `).all();

    const formatted = workflows.map(wf => ({
      ...wf,
      trigger_config: JSON.parse(wf.trigger_config || '{}'),
      steps: JSON.parse(wf.steps_json || '[]')
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workflows - Create a new workflow
router.post('/', (req, res) => {
  try {
    const { name, description, trigger_config, steps, status = 'active' } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Workflow name is required.' });
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one step is required in the workflow.' });
    }

    const validatedSteps = validateWorkflowSteps(steps);
    const id = 'wf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    const triggerData = trigger_config && typeof trigger_config === 'object' 
      ? trigger_config 
      : { type: 'manual', name: 'Manual Trigger' };

    const stmt = db.prepare(`
      INSERT INTO workflows (id, name, description, trigger_config, steps_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name.trim(),
      description || '',
      JSON.stringify(triggerData),
      JSON.stringify(validatedSteps),
      status,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);

    res.status(201).json({
      success: true,
      data: {
        ...created,
        trigger_config: JSON.parse(created.trigger_config),
        steps: JSON.parse(created.steps_json)
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/workflows/:id - Get workflow by ID
router.get('/:id', (req, res) => {
  try {
    const wf = db.prepare(`
      SELECT 
        w.*,
        (SELECT COUNT(*) FROM workflow_runs r WHERE r.workflow_id = w.id) as total_runs,
        (SELECT COUNT(*) FROM workflow_runs r WHERE r.workflow_id = w.id AND r.status = 'completed') as successful_runs,
        (SELECT COUNT(*) FROM workflow_runs r WHERE r.workflow_id = w.id AND r.status = 'failed') as failed_runs
      FROM workflows w
      WHERE w.id = ?
    `).get(req.params.id);

    if (!wf) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    const runs = db.prepare(`
      SELECT id, status, current_step, wait_until, created_at, updated_at
      FROM workflow_runs
      WHERE workflow_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        ...wf,
        trigger_config: JSON.parse(wf.trigger_config || '{}'),
        steps: JSON.parse(wf.steps_json || '[]'),
        recent_runs: runs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/workflows/:id - Update workflow
router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    const { name, description, trigger_config, steps, status } = req.body;

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedStatus = status !== undefined ? status : existing.status;
    const updatedTrigger = trigger_config !== undefined ? JSON.stringify(trigger_config) : existing.trigger_config;
    
    let updatedStepsJson = existing.steps_json;
    if (steps !== undefined) {
      const validatedSteps = validateWorkflowSteps(steps);
      updatedStepsJson = JSON.stringify(validatedSteps);
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE workflows
      SET name = ?, description = ?, trigger_config = ?, steps_json = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(updatedName, updatedDesc, updatedTrigger, updatedStepsJson, updatedStatus, now, req.params.id);

    const updated = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);

    res.json({
      success: true,
      data: {
        ...updated,
        trigger_config: JSON.parse(updated.trigger_config),
        steps: JSON.parse(updated.steps_json)
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    db.prepare('DELETE FROM workflows WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: `Workflow ${req.params.id} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workflows/:id/execute - Trigger execution
router.post('/:id/execute', async (req, res) => {
  try {
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    if (workflow.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Cannot execute inactive workflow.' });
    }

    // Default payload if none provided
    let inputPayload = req.body.payload || req.body.input || {};
    if (Object.keys(inputPayload).length === 0) {
      try {
        const trigger = JSON.parse(workflow.trigger_config || '{}');
        if (trigger.sample_input) {
          inputPayload = trigger.sample_input;
        } else {
          inputPayload = { amount: 650, customer: 'Test Customer', email: 'test@example.com' };
        }
      } catch (e) {
        inputPayload = { amount: 650 };
      }
    }

    const runId = await engine.startRun(workflow.id, inputPayload);

    res.status(202).json({
      success: true,
      message: 'Workflow execution initiated.',
      data: {
        run_id: runId,
        workflow_id: workflow.id,
        status: 'running',
        input: inputPayload
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
