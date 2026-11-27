import React, { useState } from 'react';
import { 
  Play, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  SlidersHorizontal,
  Code
} from 'lucide-react';
import api from '../services/api';

export default function RunModal({ isOpen, onClose, workflow, onRunStarted }) {
  if (!isOpen || !workflow) return null;

  const defaultSample = workflow.trigger_config?.sample_input 
    ? JSON.stringify(workflow.trigger_config.sample_input, null, 2)
    : JSON.stringify({
        order_id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        customer_name: 'Sarah Connor',
        email: 'sarah.connor@example.com',
        amount: 750,
        currency: 'USD'
      }, null, 2);

  const [payloadText, setPayloadText] = useState(defaultSample);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setPreset = (amount, customer) => {
    try {
      const obj = JSON.parse(payloadText);
      obj.amount = amount;
      if (customer) obj.customer_name = customer;
      setPayloadText(JSON.stringify(obj, null, 2));
    } catch (e) {
      setPayloadText(JSON.stringify({
        order_id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        customer_name: customer || 'Test Customer',
        amount: amount,
        email: 'user@example.com'
      }, null, 2));
    }
  };

  const handleExecute = async () => {
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch (e) {
      setError('Invalid JSON payload: ' + e.message);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.executeWorkflow(workflow.id, parsedPayload);
      if (res.success && res.data?.run_id) {
        onRunStarted(res.data.run_id);
        onClose();
      } else {
        setError(res.error || 'Failed to trigger execution.');
      }
    } catch (err) {
      setError(err.message || 'Execution request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Play className="w-5 h-5 fill-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Run Workflow</h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{workflow.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Quick presets */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Test Presets:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreset(750, 'Sarah Connor (VIP)')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                High Value ($750 - Passes &gt; 500)
              </button>
              <button
                type="button"
                onClick={() => setPreset(320, 'Alex Standard')}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                Low Value ($320 - Fails &gt; 500)
              </button>
            </div>
          </div>

          {/* JSON Payload Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Trigger Payload JSON
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Code className="w-3 h-3" /> Valid JSON required
              </span>
            </div>
            <textarea
              rows={8}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Triggering Engine...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Workflow Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
