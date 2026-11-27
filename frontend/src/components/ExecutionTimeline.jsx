import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlayCircle, 
  AlertCircle, 
  Send, 
  Cpu, 
  GitFork, 
  RotateCw,
  Hash,
  ShieldCheck,
  ChevronRight,
  Terminal
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import api from '../services/api';

export default function ExecutionTimeline({ runId, onClose, onRerun }) {
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'logs' | 'messages' | 'payload'

  const fetchRunDetails = async () => {
    if (!runId) return;
    try {
      const res = await api.getRun(runId);
      if (res.success && res.data) {
        setRun(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch run:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunDetails();

    // Auto-refresh every 1.5 seconds if run is running or waiting
    const interval = setInterval(() => {
      if (run && (run.status === 'running' || run.status === 'waiting' || run.status === 'pending')) {
        fetchRunDetails();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [runId, run?.status]);

  if (!runId) return null;

  const getStepStatus = (stepIndex) => {
    if (!run) return 'pending';
    if (run.status === 'failed' && run.current_step === stepIndex) return 'failed';
    if (run.status === 'waiting' && run.current_step === stepIndex) return 'waiting';
    if (run.status === 'running' && run.current_step === stepIndex) return 'running';
    if (run.current_step > stepIndex || run.status === 'completed') return 'completed';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-500">Run ID: {run?.id}</span>
            <StatusBadge status={run?.status || 'loading'} size="xs" />
          </div>
          <h3 className="font-bold text-base text-slate-900">
            {run?.workflow_name || 'Workflow Execution Details'}
          </h3>
          <p className="text-xs text-slate-500">
            Started: {run?.created_at ? new Date(run.created_at).toLocaleString() : 'Loading...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRunDetails}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            title="Refresh Details"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          {onRerun && (
            <button
              onClick={() => onRerun(run?.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-200 text-xs font-semibold transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Re-run Execution</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-5 bg-white text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-3 px-3 border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Visual Flow ({run?.steps?.length || 0} Steps)
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Execution Logs ({run?.logs?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'messages'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Idempotent Deliveries ({run?.message_deliveries?.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('payload')}
          className={`py-3 px-3 border-b-2 transition-colors ${
            activeTab === 'payload'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Payload State
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {run?.status === 'waiting' && run.wait_until && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                </div>
                <div>
                  <span className="font-bold text-xs text-amber-900 block">
                    Execution Paused on Wait Step
                  </span>
                  <span className="text-xs text-amber-700">
                    Resuming automatically at {new Date(run.wait_until).toLocaleTimeString()} ({new Date(run.wait_until).toLocaleDateString()})
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {run?.steps?.map((step, idx) => {
                const stepStatus = getStepStatus(idx);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      stepStatus === 'completed'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : stepStatus === 'running'
                        ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-primary-100'
                        : stepStatus === 'waiting'
                        ? 'bg-amber-50/40 border-amber-300 ring-2 ring-amber-100'
                        : stepStatus === 'failed'
                        ? 'bg-rose-50/40 border-rose-300'
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-white border font-bold text-xs flex items-center justify-center shadow-2xs">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border">
                          {step.type}
                        </span>
                        <span className="font-semibold text-sm text-slate-800">{step.name}</span>
                      </div>
                      <StatusBadge status={stepStatus} size="xs" />
                    </div>

                    <div className="text-xs text-slate-600 pl-8 space-y-1">
                      {step.type === 'condition' && (
                        <p>
                          Evaluates condition: <code className="bg-white px-1.5 py-0.5 rounded border font-mono text-primary-600">{step.field} {step.operator} {step.value}</code>
                        </p>
                      )}
                      {step.type === 'wait' && (
                        <p>
                          Configured pause: <span className="font-semibold">{step.duration_seconds} seconds</span>
                        </p>
                      )}
                      {step.type === 'message' && (
                        <p>
                          Message dispatch: <span className="italic">"{step.content}"</span>
                        </p>
                      )}
                      {step.type === 'task' && (
                        <p>
                          Task action: <span className="font-mono text-primary-600">{step.action}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            {run?.logs?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No logs recorded yet.</p>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Step</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Log Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {run?.logs?.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {log.step_index !== null ? `Step ${log.step_index + 1}` : '-'}
                        </td>
                        <td className="py-2 px-3">
                          <StatusBadge status={log.status} size="xs" />
                        </td>
                        <td className="py-2 px-3 text-slate-800 break-words">
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Idempotency Protection Active</span>
              </div>
              <span className="text-[11px] text-emerald-700">Guaranteed exactly-once message dispatch</span>
            </div>

            {run?.message_deliveries?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No message delivery records found for this run.</p>
            ) : (
              <div className="space-y-3">
                {run?.message_deliveries?.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">Record #{msg.id}</span>
                        <StatusBadge status={msg.status} size="xs" />
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Idempotency Key:
                      </span>
                      <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                        {msg.idempotency_key}
                      </code>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Message Content:
                      </span>
                      <p className="text-xs text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-0.5">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payload' && (
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Durable Run Payload Context
            </span>
            <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto">
              {JSON.stringify(run?.input || {}, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
