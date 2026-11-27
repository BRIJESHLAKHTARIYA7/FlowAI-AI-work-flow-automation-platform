import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'flowai.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trigger_config TEXT NOT NULL,
      steps_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      status TEXT NOT NULL,
      current_step INTEGER NOT NULL DEFAULT 0,
      input_json TEXT NOT NULL,
      wait_until TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      step_index INTEGER,
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS message_deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      idempotency_key TEXT UNIQUE NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_runs_wait_until ON workflow_runs(wait_until);
    CREATE INDEX IF NOT EXISTS idx_execution_logs_run_id ON execution_logs(run_id);
    CREATE INDEX IF NOT EXISTS idx_message_deliveries_key ON message_deliveries(idempotency_key);
  `);

  // Seed demo workflow if none exists
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM workflows').get().count;
  if (existingCount === 0) {
    seedDemoWorkflow();
  }
}

export function seedDemoWorkflow() {
  const demoWorkflow = {
    id: 'demo-order-followup-1',
    name: 'High Value Order Follow-up',
    description: 'When a new order arrives, if the amount is greater than $500, wait 10 seconds and send a simulated follow-up message.',
    trigger_config: JSON.stringify({
      type: 'order_received',
      name: 'New order received',
      sample_input: {
        order_id: 'ORD-98231',
        customer_name: 'Sarah Connor',
        email: 'sarah.connor@example.com',
        amount: 750,
        currency: 'USD',
        items: ['Quantum Processor x1', 'Thermal Cooler x2']
      }
    }),
    steps_json: JSON.stringify([
      {
        id: 'step-1',
        type: 'condition',
        name: 'Check High Value Order (> 500)',
        field: 'amount',
        operator: 'greater_than',
        value: 500
      },
      {
        id: 'step-2',
        type: 'wait',
        name: 'Wait 10 Seconds for Processing',
        duration_seconds: 10
      },
      {
        id: 'step-3',
        type: 'message',
        name: 'Dispatch VIP Customer Thank You Note',
        content: 'Thank you for your high-value order! We will follow up shortly.'
      }
    ]),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const insert = db.prepare(`
    INSERT INTO workflows (id, name, description, trigger_config, steps_json, status, created_at, updated_at)
    VALUES (@id, @name, @description, @trigger_config, @steps_json, @status, @created_at, @updated_at)
  `);

  insert.run(demoWorkflow);
  console.log('Pre-seeded demo workflow "High Value Order Follow-up" successfully.');
}

export default db;
