import React from 'react';
import { 
  LayoutDashboard, 
  Workflow, 
  PlusCircle, 
  History, 
  Settings, 
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, onOpenAiModal, health }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workflows', label: 'All Workflows', icon: Workflow },
    { id: 'create', label: 'Create Workflow', icon: PlusCircle },
    { id: 'runs', label: 'Execution History', icon: History },
    { id: 'settings', label: 'Settings & Health', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-accent-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">FlowAI</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded border border-primary-200/60">v1.0</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Automation Engine</p>
          </div>
        </div>
      </div>

      {/* AI Assistant Quick Launcher */}
      <div className="p-3 mx-3 my-3 bg-gradient-to-br from-primary-50 via-indigo-50/50 to-purple-50 rounded-xl border border-primary-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-primary-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-500" />
            AI Workflow Builder
          </span>
        </div>
        <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
          Describe workflows in plain English and compile instantly.
        </p>
        <button
          onClick={onOpenAiModal}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate with AI</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-primary-400" />}
            </button>
          );
        })}
      </nav>

      {/* System Status & Engine Health */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Engine State</span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                health?.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="text-xs font-medium text-slate-700">
              {health?.status === 'healthy' ? 'Active' : 'Connecting'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2.5 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Database:</span>
            <span className="font-mono text-slate-700 font-medium">SQLite WAL</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Recovery:</span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Enabled
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
