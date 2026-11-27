import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PlayCircle, 
  AlertCircle, 
  Send, 
  HelpCircle,
  PauseCircle
} from 'lucide-react';

export default function StatusBadge({ status, size = 'sm' }) {
  const normalized = (status || 'unknown').toLowerCase();

  const configs = {
    active: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      label: 'Active'
    },
    inactive: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: PauseCircle,
      label: 'Inactive'
    },
    completed: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      label: 'Completed'
    },
    delivered: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Send,
      label: 'Delivered'
    },
    running: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse',
      icon: PlayCircle,
      label: 'Running'
    },
    waiting: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
      label: 'Waiting'
    },
    failed: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
      label: 'Failed'
    },
    pending: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
      label: 'Pending'
    },
    info: {
      bg: 'bg-sky-50 text-sky-700 border-sky-200',
      icon: AlertCircle,
      label: 'Info'
    },
    skipped: {
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      icon: AlertCircle,
      label: 'Skipped'
    }
  };

  const config = configs[normalized] || {
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: HelpCircle,
    label: status || 'Unknown'
  };

  const Icon = config.icon;
  const sizeClasses = size === 'xs' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : size === 'md' 
      ? 'text-sm px-3 py-1 gap-1.5' 
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${sizeClasses}`}>
      <Icon className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}
