import React from 'react';
import { 
  Workflow, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  ArrowUpRight,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function DashboardCards({ stats }) {
  const cards = [
    {
      title: 'Total Workflows',
      value: stats?.workflows?.total ?? 0,
      subtext: `${stats?.workflows?.active ?? 0} actively listening`,
      icon: Workflow,
      iconBg: 'bg-primary-50 text-primary-600',
      borderAccent: 'hover:border-primary-300'
    },
    {
      title: 'Active Workflows',
      value: stats?.workflows?.active ?? 0,
      subtext: `${stats?.workflows?.inactive ?? 0} currently paused`,
      icon: Zap,
      iconBg: 'bg-indigo-50 text-indigo-600',
      borderAccent: 'hover:border-indigo-300'
    },
    {
      title: 'Successful Executions',
      value: stats?.executions?.successful ?? 0,
      subtext: `${stats?.executions?.success_rate ?? 100}% reliability rate`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      borderAccent: 'hover:border-emerald-300'
    },
    {
      title: 'Failed / Waiting',
      value: `${stats?.executions?.failed ?? 0} / ${stats?.executions?.waiting ?? 0}`,
      subtext: `${stats?.executions?.waiting ?? 0} scheduled on timer`,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
      borderAccent: 'hover:border-amber-300'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm transition-all duration-200 ${card.borderAccent}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {card.value}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
