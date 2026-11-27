import db from './db.js';

class WorkflowEngine {
  constructor() {
    this.tickerInterval = null;
    this.activeRunPromises = new Map();
  }

  start() {
    console.log('[WorkflowEngine] Starting execution engine and recovery monitor...');
    this.recoverUnfinishedRuns();

    // Background ticker every 1000ms for wait deadlines
    this.tickerInterval = setInterval(() => {
      this.checkWaitingDeadlines();
    }, 1000);
  }

  stop() {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }

  // Helper to safely get nested field from object (e.g. "order.amount" or "amount")
  getFieldValue(obj, fieldPath) {
    if (!obj || !fieldPath) return undefined;
    if (obj[fieldPath] !== undefined) return obj[fieldPath];

    const parts = fieldPath.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  // Create an execution log entry
  log(runId, stepIndex, status, message) {
    const stmt = db.prepare(`
      INSERT INTO execution_logs (run_id, step_index, status, message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(runId, stepIndex, status, message, new Date().toISOString());
  }

  // Update run status safely in SQLite
  updateRunStatus(runId, status, currentStep, waitUntil = null) {
    const stmt = db.prepare(`
      UPDATE workflow_runs
      SET status = ?, current_step = ?, wait_until = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(status, currentStep, waitUntil, new Date().toISOString(), runId);
  }

  // Server crash recovery on startup
  recoverUnfinishedRuns() {
    try {
      // 1. Recover 'running' runs
      const runningRuns = db.prepare(`
        SELECT r.*, w.steps_json
        FROM workflow_runs r
        JOIN workflows w ON r.workflow_id = w.id
        WHERE r.status = 'running'
      `).all();

      if (runningRuns.length > 0) {
        console.log(`[WorkflowEngine] Found ${runningRuns.length} running runs to recover from restart.`);
        for (const run of runningRuns) {
          this.log(run.id, run.current_step, 'info', `Server restart recovery: Resuming run from step index ${run.current_step}.`);
          this.executeSequential(run.id, run.current_step);
        }
      }

      // 2. Check 'waiting' runs
      const waitingRuns = db.prepare(`
        SELECT r.*, w.steps_json
        FROM workflow_runs r
        JOIN workflows w ON r.workflow_id = w.id
        WHERE r.status = 'waiting'
      `).all();

      if (waitingRuns.length > 0) {
        console.log(`[WorkflowEngine] Found ${waitingRuns.length} waiting runs monitored.`);
        const now = new Date().toISOString();
        for (const run of waitingRuns) {
          if (run.wait_until && run.wait_until <= now) {
            console.log(`[WorkflowEngine] Waiting deadline already passed during restart for run ${run.id}. Resuming.`);
            this.log(run.id, run.current_step, 'info', `Deadline expired during restart. Resuming execution.`);
            this.updateRunStatus(run.id, 'running', run.current_step + 1, null);
            this.executeSequential(run.id, run.current_step + 1);
          }
        }
      }
    } catch (err) {
      console.error('[WorkflowEngine] Error during crash recovery:', err);
    }
  }

  // Background ticker for wait deadlines
  checkWaitingDeadlines() {
    try {
      const now = new Date().toISOString();
      const expiredRuns = db.prepare(`
        SELECT id, current_step
        FROM workflow_runs
        WHERE status = 'waiting' AND wait_until IS NOT NULL AND wait_until <= ?
      `).all(now);

      for (const run of expiredRuns) {
        console.log(`[WorkflowEngine] Wait deadline reached for run ${run.id}. Resuming step ${run.current_step + 1}.`);
        this.log(run.id, run.current_step, 'completed', `Wait duration ended. Resuming workflow.`);
        
        const nextStep = run.current_step + 1;
        this.updateRunStatus(run.id, 'running', nextStep, null);
        this.executeSequential(run.id, nextStep);
      }
    } catch (err) {
      console.error('[WorkflowEngine] Error checking wait deadlines:', err);
    }
  }

  // Start executing a workflow
  async startRun(workflowId, inputPayload = {}) {
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found.`);
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow "${workflow.name}" is currently inactive.`);
    }

    const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();

    const insertRun = db.prepare(`
      INSERT INTO workflow_runs (id, workflow_id, status, current_step, input_json, wait_until, created_at, updated_at)
      VALUES (?, ?, 'running', 0, ?, NULL, ?, ?)
    `);

    insertRun.run(runId, workflowId, JSON.stringify(inputPayload), now, now);

    this.log(runId, 0, 'info', `Workflow execution started for "${workflow.name}". Initial payload recorded.`);

    // Execute asynchronously so the API returns runId immediately
    setImmediate(() => {
      this.executeSequential(runId, 0);
    });

    return runId;
  }

  // Sequential step execution loop
  async executeSequential(runId, fromStepIndex = 0) {
    if (this.activeRunPromises.has(runId)) {
      console.log(`[WorkflowEngine] Run ${runId} is already actively executing.`);
      return;
    }

    this.activeRunPromises.set(runId, true);

    const executionPromise = (async () => {
      try {
        const run = db.prepare(`
          SELECT r.*, w.steps_json, w.name as workflow_name
          FROM workflow_runs r
          JOIN workflows w ON r.workflow_id = w.id
          WHERE r.id = ?
        `).get(runId);

        if (!run) {
          console.error(`[WorkflowEngine] Run ${runId} not found in database.`);
          return;
        }

        let steps = [];
        try {
          steps = JSON.parse(run.steps_json);
        } catch (e) {
          this.log(runId, fromStepIndex, 'failed', `Failed to parse workflow steps JSON: ${e.message}`);
          this.updateRunStatus(runId, 'failed', fromStepIndex);
          return;
        }

        let context = {};
        try {
          context = JSON.parse(run.input_json);
        } catch (e) {
          context = {};
        }

        for (let i = fromStepIndex; i < steps.length; i++) {
          const step = steps[i];
          const stepNum = i + 1;
          const stepName = step.name || `Step ${stepNum} (${step.type})`;

          // Ensure run is marked as running and step index persisted
          this.updateRunStatus(runId, 'running', i);
          this.log(runId, i, 'running', `Executing Step ${stepNum}: [${step.type.toUpperCase()}] ${stepName}`);

          if (step.type === 'trigger') {
            // Trigger step verification
            this.log(runId, i, 'completed', `Trigger step verified: ${step.name || 'Workflow trigger event received.'}`);
            continue;
          }

          if (step.type === 'condition') {
            const passed = this.evaluateCondition(step, context);
            const actualVal = this.getFieldValue(context, step.field);
            
            if (passed) {
              this.log(
                runId,
                i,
                'completed',
                `Condition passed: "${step.field}" (${JSON.stringify(actualVal)}) ${step.operator} ${JSON.stringify(step.value)}`
              );
            } else {
              this.log(
                runId,
                i,
                'failed',
                `Condition not met: "${step.field}" (${JSON.stringify(actualVal)}) is not ${step.operator} ${JSON.stringify(step.value)}. Workflow halted.`
              );
              // Halting remaining steps cleanly
              this.updateRunStatus(runId, 'completed', i);
              return;
            }
          } else if (step.type === 'task') {
            const taskResult = await this.executeTask(step, context, runId, i);
            context[`task_result_${i}`] = taskResult;
            
            // Persist updated context into input_json for full durability
            db.prepare('UPDATE workflow_runs SET input_json = ? WHERE id = ?')
              .run(JSON.stringify(context), runId);

            this.log(
              runId,
              i,
              'completed',
              `Task "${stepName}" completed successfully. Output: ${JSON.stringify(taskResult)}`
            );
          } else if (step.type === 'wait') {
            const duration = parseInt(step.duration_seconds, 10) || 5;
            const waitUntil = new Date(Date.now() + duration * 1000).toISOString();

            // Persist wait deadline in database atomically before pausing execution
            const updateWaitTransaction = db.transaction(() => {
              this.updateRunStatus(runId, 'waiting', i, waitUntil);
              this.log(
                runId,
                i,
                'waiting',
                `Wait step active. Pausing execution for ${duration}s until ${new Date(waitUntil).toLocaleTimeString()}.`
              );
            });
            updateWaitTransaction();

            console.log(`[WorkflowEngine] Run ${runId} is now WAITING until ${waitUntil}.`);
            // Stop loop; the background ticker will resume from step i + 1 when deadline passes
            return;
          } else if (step.type === 'message') {
            await this.executeMessage(step, context, runId, i);
          } else {
            this.log(runId, i, 'info', `Generic step ${step.type} executed successfully.`);
          }

          // Durably record step completion index
          this.updateRunStatus(runId, 'running', i + 1);
        }

        // All steps completed successfully
        this.updateRunStatus(runId, 'completed', steps.length);
        this.log(runId, steps.length, 'completed', `All ${steps.length} workflow steps completed successfully.`);
      } catch (err) {
        console.error(`[WorkflowEngine] Error executing run ${runId}:`, err);
        this.log(runId, fromStepIndex, 'failed', `Execution error: ${err.message}`);
        this.updateRunStatus(runId, 'failed', fromStepIndex);
      } finally {
        this.activeRunPromises.delete(runId);
      }
    })();

    return executionPromise;
  }

  evaluateCondition(step, context) {
    const rawVal = this.getFieldValue(context, step.field);
    const targetVal = step.value;
    const operator = step.operator || 'equals';

    if (rawVal === undefined || rawVal === null) {
      if (operator === 'is_null' || operator === 'is_empty') return true;
      return false;
    }

    const numRaw = Number(rawVal);
    const numTarget = Number(targetVal);
    const isNumeric = !isNaN(numRaw) && !isNaN(numTarget);

    switch (operator) {
      case 'greater_than':
      case '>':
        return isNumeric ? numRaw > numTarget : String(rawVal) > String(targetVal);

      case 'greater_than_or_equal':
      case '>=':
        return isNumeric ? numRaw >= numTarget : String(rawVal) >= String(targetVal);

      case 'less_than':
      case '<':
        return isNumeric ? numRaw < numTarget : String(rawVal) < String(targetVal);

      case 'less_than_or_equal':
      case '<=':
        return isNumeric ? numRaw <= numTarget : String(rawVal) <= String(targetVal);

      case 'equals':
      case '==':
      case '===':
        return isNumeric ? numRaw === numTarget : String(rawVal).toLowerCase() === String(targetVal).toLowerCase();

      case 'not_equals':
      case '!=':
        return isNumeric ? numRaw !== numTarget : String(rawVal).toLowerCase() !== String(targetVal).toLowerCase();

      case 'contains':
        return String(rawVal).toLowerCase().includes(String(targetVal).toLowerCase());

      default:
        return false;
    }
  }

  async executeTask(step, context, runId, stepIndex) {
    const action = step.action || 'default_task';
    
    // Simulate real task operations
    if (action === 'calculate_discount' || step.name?.toLowerCase().includes('discount')) {
      const amount = Number(this.getFieldValue(context, 'amount')) || 100;
      const rate = step.discount_rate || 0.15;
      const discount = Math.round(amount * rate * 100) / 100;
      return {
        action: 'calculate_discount',
        original_amount: amount,
        discount_applied: discount,
        final_amount: amount - discount,
        discount_code: 'VIP_AUTO_' + Math.floor(1000 + Math.random() * 9000)
      };
    }

    if (action === 'generate_invoice' || step.name?.toLowerCase().includes('invoice')) {
      return {
        action: 'generate_invoice',
        invoice_number: 'INV-' + Date.now().toString().slice(-6),
        created_at: new Date().toISOString(),
        status: 'draft_generated'
      };
    }

    // Default task execution
    return {
      action,
      executed_at: new Date().toISOString(),
      status: 'success',
      step_name: step.name || 'Custom Task'
    };
  }

  // Idempotent message delivery step
  async executeMessage(step, context, runId, stepIndex) {
    // Generate deterministic idempotency key for this run + step
    const idempotencyKey = step.idempotency_key || `${runId}_step_${stepIndex}`;

    // Templatize message content with context data if present
    let messageBody = step.content || 'Workflow notification';
    messageBody = messageBody.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      return context[key] !== undefined ? context[key] : `{{${key}}}`;
    });

    const runDeliveryTransaction = db.transaction(() => {
      // Check for existing delivery with this idempotency key
      const existing = db.prepare(`
        SELECT id, idempotency_key, status, created_at
        FROM message_deliveries
        WHERE idempotency_key = ?
      `).get(idempotencyKey);

      if (existing) {
        this.log(
          runId,
          stepIndex,
          'completed',
          `[IDEMPOTENT] Duplicate message delivery skipped. Delivery record #${existing.id} already exists with key: ${idempotencyKey}`
        );
        return { duplicate: true, record: existing };
      }

      // Record durable delivery
      const insert = db.prepare(`
        INSERT INTO message_deliveries (run_id, idempotency_key, message, status, created_at)
        VALUES (?, ?, ?, 'delivered', ?)
      `);
      const info = insert.run(runId, idempotencyKey, messageBody, new Date().toISOString());

      this.log(
        runId,
        stepIndex,
        'completed',
        `Simulated message sent. Idempotency Key: "${idempotencyKey}". Content: "${messageBody}"`
      );

      return { duplicate: false, id: info.lastInsertRowid };
    });

    return runDeliveryTransaction();
  }
}

export const engine = new WorkflowEngine();
export default engine;
