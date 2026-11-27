import React from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Send, 
  GitFork, 
  Cpu, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function StepBuilder({ steps, onChange }) {
  const addStep = (type) => {
    const newStepIndex = steps.length + 1;
    let newStep = {
      id: 'step-' + Date.now().toString(36),
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Step ${newStepIndex}`
    };

    if (type === 'condition') {
      newStep = {
        ...newStep,
        name: 'Check Order Amount (> 500)',
        field: 'amount',
        operator: 'greater_than',
        value: 500
      };
    } else if (type === 'task') {
      newStep = {
        ...newStep,
        name: 'Calculate Customer VIP Discount',
        action: 'calculate_discount',
        discount_rate: 0.15
      };
    } else if (type === 'wait') {
      newStep = {
        ...newStep,
        name: 'Wait 10 Seconds for Processing',
        duration_seconds: 10
      };
    } else if (type === 'message') {
      newStep = {
        ...newStep,
        name: 'Send Customer Thank You Note',
        content: 'Thank you for your high-value order! We will follow up shortly.'
      };
    }

    onChange([...steps, newStep]);
  };

  const removeStep = (index) => {
    const updated = steps.filter((_, i) => i !== index);
    onChange(updated);
  };

  const moveStep = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    onChange(updated);
  };

  const updateStepField = (index, field, value) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'condition': return GitFork;
      case 'task': return Cpu;
      case 'wait': return Clock;
      case 'message': return Send;
      default: return Sparkles;
    }
  };

  const getStepColor = (type) => {
    switch (type) {
      case 'condition': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'task': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'wait': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'message': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const Icon = getStepIcon(step.type);
          const colorClass = getStepColor(step.type);

          return (
            <div
              key={step.id || idx}
              className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-4 transition-all hover:border-slate-300 relative group"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className={`p-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${colorClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{step.type}</span>
                  </div>
                  <input
                    type="text"
                    value={step.name || ''}
                    onChange={(e) => updateStepField(idx, 'name', e.target.value)}
                    className="font-semibold text-sm text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:outline-none px-1"
                    placeholder="Step name"
                  />
                </div>

                {/* Actions: Reorder & Delete */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                    title="Delete step"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Step Specific Config Form */}
              <div className="space-y-3 text-sm">
                {step.type === 'condition' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Payload Field</label>
                      <input
                        type="text"
                        value={step.field || ''}
                        onChange={(e) => updateStepField(idx, 'field', e.target.value)}
                        placeholder="amount"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Operator</label>
                      <select
                        value={step.operator || 'greater_than'}
                        onChange={(e) => updateStepField(idx, 'operator', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none bg-white"
                      >
                        <option value="greater_than">greater_than (&gt;)</option>
                        <option value="greater_than_or_equal">greater_than_or_equal (&gt;=)</option>
                        <option value="less_than">less_than (&lt;)</option>
                        <option value="less_than_or_equal">less_than_or_equal (&lt;=)</option>
                        <option value="equals">equals (==)</option>
                        <option value="not_equals">not_equals (!=)</option>
                        <option value="contains">contains</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Expected Value</label>
                      <input
                        type="text"
                        value={step.value !== undefined ? step.value : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = Number(val);
                          updateStepField(idx, 'value', !isNaN(num) && val.trim() !== '' ? num : val);
                        }}
                        placeholder="500"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {step.type === 'task' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Task Action</label>
                      <select
                        value={step.action || 'calculate_discount'}
                        onChange={(e) => updateStepField(idx, 'action', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none bg-white"
                      >
                        <option value="calculate_discount">Calculate VIP Discount (15%)</option>
                        <option value="generate_invoice">Generate Draft Invoice</option>
                        <option value="custom">Generic Custom Action</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Execution Mode</label>
                      <input
                        type="text"
                        value="Durable Sync Execution"
                        disabled
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {step.type === 'wait' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Wait Duration (seconds)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="3600"
                        value={step.duration_seconds || 10}
                        onChange={(e) => updateStepField(idx, 'duration_seconds', parseInt(e.target.value, 10) || 5)}
                        className="w-36 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500">
                        Pauses execution asynchronously; persists wait deadline to SQLite and wakes automatically.
                      </span>
                    </div>
                  </div>
                )}

                {step.type === 'message' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-600">
                        Message Content (supports <code className="bg-slate-100 px-1 py-0.5 rounded text-primary-600">{'{{customer_name}}'}</code> variables)
                      </label>
                      <span className="text-[11px] text-emerald-600 font-medium">Idempotency Protected</span>
                    </div>
                    <textarea
                      rows="2"
                      value={step.content || ''}
                      onChange={(e) => updateStepField(idx, 'content', e.target.value)}
                      placeholder="Thank you for your high-value order! We will follow up shortly."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none resize-none font-sans"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {steps.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
            <p className="text-sm font-medium text-slate-600 mb-1">No steps configured yet</p>
            <p className="text-xs text-slate-400 mb-4">Add your first step below or use the AI builder to generate automatically.</p>
          </div>
        )}
      </div>

      {/* Add Step Action Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Add Step:</span>
        <button
          type="button"
          onClick={() => addStep('condition')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-medium transition-colors"
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Condition</span>
        </button>
        <button
          type="button"
          onClick={() => addStep('task')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Task</span>
        </button>
        <button
          type="button"
          onClick={() => addStep('wait')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-medium transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Wait</span>
        </button>
        <button
          type="button"
          onClick={() => addStep('message')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Message</span>
        </button>
      </div>
    </div>
  );
}
