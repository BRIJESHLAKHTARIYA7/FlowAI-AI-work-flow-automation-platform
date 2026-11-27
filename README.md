# FlowAI – AI-Powered Workflow Automation Engine

FlowAI is an AI-powered workflow automation platform that allows users to create, manage, and execute automated workflows using natural language or a visual workflow builder.

---

## 🚀 Features

- **AI Workflow Generation:** Convert plain-English instructions into structured workflows using Google Gemini.
- **Visual Workflow Builder:** Create and manage workflows with an interactive step builder.
- **Trigger & Conditions:** Start workflows and evaluate conditions dynamically.
- **Task Execution:** Perform automated tasks such as invoice generation and discount calculation.
- **Non-Blocking Wait:** Schedule delays without blocking server execution.
- **Message Automation:** Dispatch messages with idempotency protection.
- **Execution Monitoring:** Track workflow progress through logs and execution timelines.
- **Persistent Storage:** Store workflow and execution data using SQLite.
- **Automatic Recovery:** Resume unfinished workflows after server restarts.
- **AI Fallback:** Use a built-in rule-based NLP engine when Gemini is unavailable.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | Frontend user interface |
| **Vite** | Development and build tooling |
| **Tailwind CSS** | Responsive UI styling |
| **Node.js** | Backend JavaScript runtime |
| **Express.js** | REST API framework |
| **SQLite (`better-sqlite3`)** | Persistent database with WAL mode |
| **Google Gemini 1.5 Flash** | AI workflow generation |
| **Lucide React** | Icons |

---

## 🏗️ Architecture

FlowAI consists of five main layers:

1. **Frontend:** Dashboard, visual workflow builder, and execution monitoring.
2. **REST API:** Handles workflow creation, updates, execution, and AI requests.
3. **Workflow Engine:** Executes triggers, conditions, tasks, waits, and messages.
4. **AI Compiler:** Converts natural-language instructions into workflow definitions.
5. **Persistence Layer:** Stores workflows, execution states, logs, and message deliveries.

---

## ⚙️ Example Workflow

### High Value Order Follow-up

1. **Trigger:** New order received.
2. **Condition:** Check whether order amount is greater than ₹500 (or $500).
3. **Wait:** Pause execution for 10 seconds.
4. **Message:** Send a VIP customer thank-you message.

---

## 💻 Getting Started

### Prerequisites

- Node.js (v18+)
- npm
- Git

### Clone Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd FlowAI
```

### Install Dependencies

```bash
# Install root & backend dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install
```

### Configure Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
PORT=3001
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
*Note: If `GEMINI_API_KEY` is omitted, FlowAI automatically operates using its built-in rule-based NLP compiler.*

### Run Application

```bash
# Run both backend and frontend concurrently
npm run dev
```

- **Frontend Dashboard:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`
- **Health Check:** `http://localhost:3001/api/health`

*Note: You can also run backend (`npm run dev:server`) and frontend (`npm run dev:client`) in separate terminals.*

---

## 🔒 Reliability & Execution

FlowAI focuses on reliable workflow execution through:

- **SQLite Write-Ahead Logging (WAL):** High-concurrency read/write operations without table-locking contention.
- **Persistent Execution Checkpoints:** State and `current_step` updates are committed to disk after every step.
- **Non-Blocking Wait Scheduling:** Delays are stored as ISO timestamp deadlines (`wait_until`), keeping event-loop threads free.
- **Automatic Recovery of Unfinished Executions:** Scans and resumes interrupted or waiting runs on server boot.
- **Deterministic Idempotency Keys:** Every message step generates a unique `${run_id}_step_${step_index}` identifier.
- **Database Uniqueness Constraints:** Prevents duplicate message dispatches across retries or rapid triggers.

---

## 📈 Scalability Considerations

For supporting 50,000 concurrent workflows, the proposed architecture includes:

- **Distributed Job Queues:** Decouple API from workers using Redis Streams, BullMQ, or Apache Kafka.
- **Horizontally Scalable Execution Workers:** Stateless worker containers processing queued step tasks with heartbeat leases.
- **Redis Sorted Sets (`ZSET`):** High-throughput distributed wait scheduling via `ZRANGEBYSCORE`.
- **Optimistic Locking:** Atomic version checks (`UPDATE ... WHERE current_step = :expected`) preventing race conditions.
- **Database Sharding & Partitioning:** Shard operational tables by `workflow_id` and stream historical logs to cold storage.
- **Distributed Idempotency Protection:** Sub-millisecond duplicate checks using Redis `SETNX` distributed locks alongside database constraints.

---

## 🧪 Testing

The project includes verification scripts for:

- Workflow engine execution.
- Condition evaluation.
- AI workflow parsing.
- Wait scheduling.
- Server restart recovery.
- Duplicate message prevention.
- REST API functionality.

### Run Verification Tests

```bash
# Test engine persistence, recovery, and idempotency
node backend/test-engine.js

# Test REST API endpoints end-to-end
node backend/test-api.js

# Test live execution timeline polling
node backend/verify-full-flow.js
```

---

## 📁 Project Structure

```text
FlowAI/
├── backend/
│   ├── routes/
│   │   ├── ai.js                 # /api/ai/parse-workflow
│   │   ├── health.js             # /api/health, /api/stats, /api/test/*
│   │   ├── runs.js               # /api/runs (List, Detail, /retry)
│   │   └── workflows.js          # /api/workflows (CRUD & /execute)
│   ├── ai.js                     # AI Compiler (Gemini + Rule NLP Fallback)
│   ├── db.js                     # SQLite initialization & schema
│   ├── engine.js                 # Core execution engine & crash recovery
│   ├── server.js                 # Express server & static handler
│   ├── test-api.js               # API test suite
│   ├── test-engine.js            # Engine test suite
│   └── verify-full-flow.js       # Live execution verification
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components (StepBuilder, Timeline, etc.)
│   │   ├── pages/                # App pages (Dashboard, Workflows, History, etc.)
│   │   ├── services/             # API client
│   │   ├── App.jsx               # Main SPA shell & router
│   │   └── main.jsx              # React DOM entry point
│   └── package.json              # Frontend dependencies
├── data/
│   └── flowai.db                 # SQLite database file
├── README.md                     # Main project documentation
└── PROJECT_ANALYSIS.md           # In-depth system architecture & analysis
```

---

## 🔮 Future Enhancements

- Distributed workflow execution across container clusters.
- More third-party integrations (Slack, WhatsApp, SendGrid, Stripe webhooks).
- Advanced workflow scheduling (Cron triggers, calendar events).
- Real-time WebSocket notifications.
- Enhanced telemetry and execution analytics.

---

## 👨‍💻 Project Information

- **Project Name:** FlowAI  
- **Category:** AI Full-Stack Development  
- **Purpose:** Workflow Automation Engine  
- **Database:** SQLite  

*Built as a production-grade solution for the Workflow Automation Engine project challenge.*
