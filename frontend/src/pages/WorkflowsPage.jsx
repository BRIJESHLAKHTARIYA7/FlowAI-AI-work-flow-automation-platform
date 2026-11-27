import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Play, 
  Trash2, 
  Edit3, 
  Sparkles, 
  RotateCw, 
  Workflow, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function WorkflowsPage({ onNavigate, onOpenAiModal, onOpenRunModal }) {
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await api.getWorkflows();
      if (res.success) {
        setWorkflows(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const toggleStatus = async (wf) => {
    const nextStatus = wf.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.updateWorkflow(wf.id, { status: nextStatus });
      if (res.success) {
        setWorkflows(workflows.map(w => w.id === wf.id ? { ...w, status: nextStatus } : w));
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete workflow "${name}"?`)) return;
    try {
      const res = await api.deleteWorkflow(id);
      if (res.success) {
        setWorkflows(workflows.filter(w => w.id !== id));
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filtered = workflows.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || 
      (w.description && w.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workflows</h1>
          <p className="text-xs text-slate-500">Configure, inspect, and trigger stateful automated pipelines</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white text-xs font-semibold shadow-2xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </button>
          <button
            onClick={() => onNavigate('create')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </button>
          <button
            onClick={fetchWorkflows}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            title="Refresh"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows by name or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-primary-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium">Status:</span>
          {['all', 'active', 'inactive'].map((st) => (
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

      {/* Workflow Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((wf) => (
          <div
            key={wf.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col p-5"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 block truncate mb-0.5">
                  {wf.name}
                </span>
                <span className="font-mono text-[10px] text-slate-400 block truncate">
                  ID: {wf.id}
                </span>
              </div>
              <button
                onClick={() => toggleStatus(wf)}
                title="Toggle Active / Inactive"
              >
                <StatusBadge status={wf.status} size="xs" />
              </button>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 mb-4 flex-1">
              {wf.description || 'No description provided.'}
            </p>

            {/* Steps & Stats */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Steps:
                </span>
                <span className="font-semibold text-slate-700">{wf.steps?.length || 0} configured</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Total Runs:
                </span>
                <span className="font-semibold text-slate-700">{wf.total_runs || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Success:
                </span>
                <span className="font-semibold text-emerald-600">{wf.successful_runs || 0}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => onOpenRunModal(wf)}
                disabled={wf.status !== 'active'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-600" />
                <span>Execute</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onNavigate('details', wf.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Edit & View Runs"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(wf.id, wf.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Workflow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Workflow className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm mb-1">No workflows found</h3>
          <p className="text-xs text-slate-500 mb-4">
            Try adjusting your search filter or create a new automated workflow.
          </p>
          <button
            onClick={() => onNavigate('create')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold shadow-2xs hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
      )}
    </div>
  );
}
