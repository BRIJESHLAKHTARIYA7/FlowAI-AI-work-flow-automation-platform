import React, { useEffect, useState } from 'react';
import { 
  History, 
  RotateCw, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlayCircle,
  ExternalLink,
  X
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ExecutionTimeline from '../components/ExecutionTimeline';
import api from '../services/api';

export default function ExecutionHistoryPage({ selectedRunId, onSelectRun, onRerun }) {
  const [runs, setRuns] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRuns = async () => {
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await api.getRuns(params);
      if (res.success) {
        setRuns(res.data);
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // Poll every 3 seconds to catch updates to running or waiting executions
    const interval = setInterval(fetchRuns, 3000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const filtered = runs.filter(r => {
    return (
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.workflow_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Execution History</h1>
          <p className="text-xs text-slate-500">
            Durable audit trail of workflow executions, conditions, wait deadlines, and dispatches
          </p>
        </div>

        <button
          onClick={fetchRuns}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Executions</span>
        </button>
      </div>

      {/* Selected Run Drawer / View */}
      {selectedRunId && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700">
              Active Run Inspection
            </span>
            <button
              onClick={() => onSelectRun(null)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Close Inspection</span>
            </button>
          </div>
          <ExecutionTimeline
            runId={selectedRunId}
            onClose={() => onSelectRun(null)}
            onRerun={onRerun}
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Run ID or Workflow Name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-primary-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 font-medium mr-1">Status:</span>
          {['all', 'running', 'waiting', 'completed', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                filterStatus === st
                  ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Run ID</th>
              <th className="py-3 px-4">Workflow Name</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Progress</th>
              <th className="py-3 px-4">Wait Until / Timestamp</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((run) => (
              <tr
                key={run.id}
                className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                  selectedRunId === run.id ? 'bg-primary-50/40' : ''
                }`}
                onClick={() => onSelectRun(run.id)}
              >
                <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                  {run.id}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {run.workflow_name}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={run.status} size="xs" />
                </td>
                <td className="py-3 px-4 text-slate-600 font-medium">
                  Step {run.current_step + 1} of {run.total_steps || '-'}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {run.status === 'waiting' && run.wait_until ? (
                    <span className="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Until {new Date(run.wait_until).toLocaleTimeString()}
                    </span>
                  ) : (
                    new Date(run.created_at).toLocaleString()
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRun(run.id);
                    }}
                    className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-semibold text-xs"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                  No execution runs found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
