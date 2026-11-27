import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Save, 
  Trash2, 
  RotateCw, 
  Layers, 
  History, 
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Zap,
  Code
} from 'lucide-react';
import StepBuilder from '../components/StepBuilder';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

export default function WorkflowDetailsPage({ workflowId, onNavigate, onOpenRunModal, onSelectRun }) {
  const [workflow, setWorkflow] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [steps, setSteps] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const res = await api.getWorkflow(workflowId);
      if (res.success && res.data) {
        const wf = res.data;
        setWorkflow(wf);
        setName(wf.name);
        setDescription(wf.description || '');
        setStatus(wf.status);
        setSteps(wf.steps || []);
        setRecentRuns(wf.recent_runs || []);
      }
    } catch (err) {
      console.error('Failed to load workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.updateWorkflow(workflowId, {
        name,
        description,
        status,
        steps
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Workflow updated successfully.' });
        fetchWorkflow();
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update workflow.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error updating workflow.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete workflow "${name}"?`)) return;
    try {
      const res = await api.deleteWorkflow(workflowId);
      if (res.success) {
        onNavigate('workflows');
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
        Loading workflow configuration...
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-700 mb-2">Workflow not found</p>
        <button
          onClick={() => onNavigate('workflows')}
          className="text-xs text-primary-600 font-semibold"
        >
          Return to Workflows
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('workflows')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{name}</h1>
              <StatusBadge status={status} size="xs" />
            </div>
            <p className="text-xs font-mono text-slate-400">ID: {workflowId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenRunModal(workflow)}
            disabled={status !== 'active'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Execute Now</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Workflow"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Metadata Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-medium text-slate-700">Workflow Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Workflow Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
            >
              <option value="active">Active (Listening & Runnable)</option>
              <option value="inactive">Inactive (Paused)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Steps Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Configured Steps ({steps.length})
          </span>
          <span className="text-xs text-slate-400">
            Add or reorder sequential steps below
          </span>
        </div>

        <StepBuilder steps={steps} onChange={setSteps} />
      </div>

      {/* Past Runs for this Workflow */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-sm text-slate-900">Execution History for this Workflow</h2>
          </div>
          <span className="text-xs text-slate-400">{recentRuns.length} recorded runs</span>
        </div>

        {recentRuns.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-3 text-center">No runs recorded for this workflow yet.</p>
        ) : (
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => onSelectRun(run.id)}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium text-slate-600">{run.id}</span>
                  <StatusBadge status={run.status} size="xs" />
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span>Step {run.current_step + 1}</span>
                  <span>{new Date(run.created_at).toLocaleString()}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
