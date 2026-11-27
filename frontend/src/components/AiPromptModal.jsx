import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  Cpu, 
  Clock, 
  Send, 
  GitFork,
  Loader2,
  Code
} from 'lucide-react';
import api from '../services/api';

export default function AiPromptModal({ isOpen, onClose, onApplyWorkflow }) {
  const [prompt, setPrompt] = useState(
    'When a new order arrives, if the amount is greater than 500, wait 10 seconds and send a follow-up message.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const [showJson, setShowJson] = useState(false);

  if (!isOpen) return null;

  const examplePrompts = [
    'When a new order arrives, if the amount is greater than 500, wait 10 seconds and send a follow-up message.',
    'When user registers, if score is greater than 80, calculate discount, wait 5 seconds and send VIP welcome email.',
    'When order received, if amount > 1000, generate invoice, wait 15 seconds, send order confirmation.'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setGeneratedWorkflow(null);

    try {
      const res = await api.parseWorkflowAi(prompt);
      if (res.success && res.data) {
        setGeneratedWorkflow(res.data);
      } else {
        setError(res.error || 'Failed to parse workflow.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with AI parser.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedWorkflow) {
      onApplyWorkflow(generatedWorkflow);
      onClose();
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary-50/50 via-white to-purple-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">AI Workflow Generator</h3>
              <p className="text-xs text-slate-500">Describe your process in plain English to generate structured steps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Natural Language Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. When a new order arrives, if the amount is greater than 500, wait 10 seconds and send a follow-up message."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all resize-none font-sans"
            />
          </div>

          {/* Quick Examples */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {examplePrompts.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="text-xs text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-primary-50 hover:text-primary-700 border border-slate-200/80 text-slate-600 transition-colors"
                >
                  "{ex.slice(0, 48)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling Steps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Compile Workflow</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generated Workflow Review Section */}
          {generatedWorkflow && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Generated Workflow Preview
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-primary-600">{generatedWorkflow.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Source: {generatedWorkflow.source === 'gemini' ? 'Gemini 1.5 Flash' : 'Rule-Based Engine'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showJson ? 'Hide JSON' : 'View JSON'}</span>
                </button>
              </div>

              {showJson ? (
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-x-auto max-h-48 font-mono">
                  {JSON.stringify(generatedWorkflow, null, 2)}
                </pre>
              ) : (
                <div className="space-y-2">
                  {generatedWorkflow.steps?.map((step, idx) => {
                    const Icon = getStepIcon(step.type);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-primary-100 text-primary-700">
                            {step.type}
                          </span>
                          <span className="font-medium text-slate-800">{step.name}</span>
                        </div>
                        {step.type === 'condition' && (
                          <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {step.field} {step.operator} {step.value}
                          </span>
                        )}
                        {step.type === 'wait' && (
                          <span className="font-mono text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {step.duration_seconds}s pause
                          </span>
                        )}
                        {step.type === 'message' && (
                          <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            "{step.content}"
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
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
            onClick={handleApply}
            disabled={!generatedWorkflow}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Workflow Builder</span>
          </button>
        </div>
      </div>
    </div>
  );
}
