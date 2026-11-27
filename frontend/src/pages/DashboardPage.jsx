import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Plus, 
  Sparkles, 
  RotateCw, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import DashboardCards from '../components/DashboardCards';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function DashboardPage({ onNavigate, onOpenAiModal, onOpenRunModal, onSelectRun }) {
  const [stats, setStats] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsRes, wfRes] = await Promise.all([
        api.getStats(),
        api.getWorkflows()
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (wfRes.success) setWorkflows(wfRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000); // Polling dashboard metrics every 4s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Autonomous Execution Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            AI-Driven Workflow Orchestration & Durable Automation
          </h1>
          <p className="text-primary-100 text-sm mb-5 leading-relaxed">
            Execute stateful workflows with persistent SQLite timers, restart recovery, and guaranteed idempotent message dispatching.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary-700 hover:bg-primary-50 text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </button>
            <button
              onClick={onOpenAiModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-800/60 hover:bg-primary-800 text-white border border-white/20 text-xs font-semibold backdrop-blur-xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-accent-300" />
              <span>Generate with AI</span>
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all ml-auto"
              title="Refresh Stats"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-[-40px] top-[-40px] w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Cards */}
      <DashboardCards stats={stats} />

      {/* Two Column Layout: Active Workflows & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Workflows Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900">Configured Workflows</h2>
              <p className="text-xs text-slate-500">Fast trigger and monitor workflows</p>
            </div>
            <button
              onClick={() => onNavigate('workflows')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {workflows.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No workflows created yet.</p>
            ) : (
              workflows.slice(0, 4).map((wf) => (
                <div
                  key={wf.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 hover:border-primary-200 hover:shadow-2xs transition-all flex items-center justify-between gap-3 bg-slate-50/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {wf.name}
                      </span>
                      <StatusBadge status={wf.status} size="xs" />
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-sm">
                      {wf.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>{wf.steps?.length || 0} steps</span>
                      <span>•</span>
                      <span>{wf.total_runs || 0} executions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenRunModal(wf)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-600" />
                      <span>Run</span>
                    </button>
                    <button
                      onClick={() => onNavigate('details', wf.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                      title="Inspect"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Executions Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900">Recent Executions</h2>
              <p className="text-xs text-slate-500">Real-time state and audit log</p>
            </div>
            <button
              onClick={() => onNavigate('runs')}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px]">
            {stats?.recent_activity?.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No runs recorded yet.</p>
            ) : (
              stats?.recent_activity?.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  onClick={() => onSelectRun(run.id)}
                  className="p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/70 transition-all cursor-pointer flex items-center justify-between text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-semibold text-slate-700 truncate">
                        {run.id}
                      </span>
                      <StatusBadge status={run.status} size="xs" />
                    </div>
                    <span className="text-slate-500 text-[11px] block truncate">
                      {run.workflow_name || 'Workflow'}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">
                      {new Date(run.created_at).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] text-primary-600 font-semibold">
                      Step {run.current_step + 1}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
