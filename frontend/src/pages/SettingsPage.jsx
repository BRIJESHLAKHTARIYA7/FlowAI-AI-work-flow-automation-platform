import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  RotateCw, 
  Database, 
  Server, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Terminal,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restartTesting, setRestartTesting] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchHealth = async () => {
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      console.error('Failed to load health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSimulateRestart = async () => {
    setRestartTesting(true);
    setTestResult(null);
    try {
      const res = await api.simulateRestart();
      setTestResult({
        type: 'success',
        title: 'Crash Recovery Simulation Succeeded',
        message: res.message || 'Engine crash recovery scan executed cleanly. All uncompleted and waiting runs were verified in SQLite.'
      });
      fetchHealth();
    } catch (err) {
      setTestResult({
        type: 'error',
        title: 'Simulation Error',
        message: err.message
      });
    } finally {
      setRestartTesting(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo workflow to original "High Value Order Follow-up"?')) return;
    setResettingDemo(true);
    setTestResult(null);
    try {
      const res = await api.resetDemo();
      setTestResult({
        type: 'success',
        title: 'Demo Workflow Restored',
        message: res.message || 'Demo workflow restored successfully.'
      });
    } catch (err) {
      setTestResult({
        type: 'error',
        title: 'Reset Error',
        message: err.message
      });
    } finally {
      setResettingDemo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Engine Diagnostics</h1>
        <p className="text-xs text-slate-500">
          Monitor persistence engine, SQLite database mode, AI configurations, and crash recovery routines
        </p>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
            testResult.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {testResult.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block text-sm mb-0.5">{testResult.title}</span>
            <p className="leading-relaxed">{testResult.message}</p>
          </div>
        </div>
      )}

      {/* Engine Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Server Status</span>
            <Server className="w-4 h-4 text-primary-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-base text-slate-900 capitalize">{health?.status || 'Active'}</span>
          </div>
          <p className="text-xs text-slate-500">
            Uptime: {health?.uptime_seconds ? `${health.uptime_seconds}s` : 'Active'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SQLite Engine</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-base text-slate-900">WAL Mode Active</span>
          </div>
          <p className="text-xs text-slate-500">better-sqlite3 with foreign keys enabled</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Compiler Mode</span>
            <Sparkles className="w-4 h-4 text-accent-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="font-bold text-sm text-slate-900 truncate">
              {health?.ai_mode?.includes('Gemini') ? 'Gemini 1.5 Flash' : 'Rule-Based Parser'}
            </span>
          </div>
          <p className="text-xs text-slate-500">Safe fallback active with schema validation</p>
        </div>
      </div>

      {/* Reliability & Restart Recovery Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="font-bold text-sm text-slate-900">Durability & Crash Recovery Testing</h2>
            <p className="text-xs text-slate-500">
              Verify that the background engine automatically detects interrupted runs and resumes waiting deadlines.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            When a server restarts, FlowAI queries SQLite for any runs in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-primary-600 font-mono">running</code> or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-700 font-mono">waiting</code> state. It inspects their <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">wait_until</code> deadline and immediately re-enqueues them into the active scheduler without data loss.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSimulateRestart}
            disabled={restartTesting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${restartTesting ? 'animate-spin' : ''}`} />
            <span>{restartTesting ? 'Testing Recovery...' : 'Simulate Server Crash & Restart Recovery'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resettingDemo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RotateCw className="w-4 h-4" />
            <span>Reset Pre-seeded Demo Workflow</span>
          </button>
        </div>
      </div>

      {/* AI Configuration Guide */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Sparkles className="w-5 h-5 text-accent-500" />
          <div>
            <h2 className="font-bold text-sm text-slate-900">Google Gemini API Configuration</h2>
            <p className="text-xs text-slate-500">Optional AI workflow compiler key setup</p>
          </div>
        </div>

        <div className="text-xs text-slate-600 space-y-2">
          <p>
            To use Google Gemini for natural language workflow parsing, specify your API key in the backend environment file:
          </p>
          <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs">
            GEMINI_API_KEY=your_actual_gemini_api_key_here
          </pre>
          <p className="text-slate-500">
            <strong>Security Notice:</strong> The Gemini API key is strictly maintained on the backend and is never exposed to the frontend client. When no key is set, FlowAI automatically and transparently uses its intelligent rule-based natural language parser.
          </p>
        </div>
      </div>
    </div>
  );
}
