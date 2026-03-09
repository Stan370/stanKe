import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Metric } from '../types';

interface StatsChartProps {
  metrics: Metric[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="h-48 w-full mt-4 bg-slate-800/50 rounded-lg p-2 border border-slate-700">
      <p className="text-xs text-slate-400 font-mono mb-2 uppercase tracking-wider">System Performance</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={metrics} layout="vertical" margin={{ left: 0, right: 30 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={100} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
            interval={0}
          />
          <Tooltip 
            cursor={{fill: 'transparent'}}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
            itemStyle={{ color: '#6366f1' }}
          />
          <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]}>
            {metrics.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};