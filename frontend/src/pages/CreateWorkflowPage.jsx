import React, { useState } from 'react';
import { 
  Save, 
  Sparkles, 
  ArrowLeft, 
  Code, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Zap
} from 'lucide-react';
import StepBuilder from '../components/StepBuilder';
import api from '../services/api';

export default function CreateWorkflowPage({ onNavigate, onOpenAiModal, initialData }) {
  const [name, setName] = useState(initialData?.name || 'High Value Order Follow-up');
  const [description, setDescription] = useState(
    initialData?.description || 'When an order arrives > 500, wait 10 seconds and dispatch a VIP confirmation message.'
  );
  const [triggerType, setTriggerType] = useState(initialData?.trigger_config?.type || 'order_received');
  
  const [steps, setSteps] = useState(
    initialData?.steps || [
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
    ]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please provide a name for this workflow.');
      return;
    }
    if (steps.length === 0) {
      setError('A workflow must contain at least one step.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      trigger_config: {
        type: triggerType,
        name: triggerType === 'order_received' ? 'New order received' : 'Custom Trigger Event',
        sample_input: {
          order_id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
          customer_name: 'Customer Name',
          email: 'customer@example.com',
          amount: 650
        }
      },
      steps,
      status: 'active'
    };

    try {
      const res = await api.createWorkflow(payload);
      if (res.success && res.data) {
        onNavigate('details', res.data.id);
      } else {
        setError(res.error || 'Failed to create workflow.');
      }
    } catch (err) {
      setError(err.message || 'Error saving workflow.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('workflows')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Workflow</h1>
            <p className="text-xs text-slate-500">Design stateful step sequences or import from AI prompt</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white text-xs font-semibold shadow-2xs transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </button>
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
          >
            <Code className="w-4 h-4 text-slate-500" />
            <span>{showJson ? 'Visual Editor' : 'JSON Schema'}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Workflow'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Workflow General Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Workflow Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-medium text-slate-700">Workflow Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High Value Order Follow-up"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">Trigger Event</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500 bg-white"
            >
              <option value="order_received">New order received</option>
              <option value="user_signup">User registered</option>
              <option value="webhook">Incoming webhook</option>
              <option value="manual">Manual trigger</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-700">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the purpose of this workflow..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Editor: Visual or Raw JSON */}
      {showJson ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Raw Step Schema JSON
            </span>
            <span className="text-xs text-slate-400">Read-only schema preview</span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto max-h-[500px]">
            {JSON.stringify(
              {
                name,
                description,
                trigger_config: { type: triggerType },
                steps
              },
              null,
              2
            )}
          </pre>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Workflow Steps Sequence ({steps.length})
            </span>
            <span className="text-xs text-slate-400">
              Steps execute sequentially with persistent state tracking
            </span>
          </div>

          <StepBuilder steps={steps} onChange={setSteps} />
        </div>
      )}

      {/* Bottom Save Action */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Workflow'}</span>
        </button>
      </div>
    </div>
  );
}
