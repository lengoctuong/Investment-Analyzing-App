
import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, ReferenceLine } from 'recharts';
import { ProcessedMetrics } from '../types';

interface ChartProps {
  data: ProcessedMetrics[];
  metric: 'Total Return' | 'Sharpe Ratio' | 'Max Drawdown' | 'Beta';
  benchmarkName?: string;
}

const COLORS = ['#14b8a6', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#ef4444'];

const OverallMetricChart: React.FC<ChartProps> = ({ data, metric, benchmarkName }) => {
  const chartData = data
    .filter(d => {
        if (d.year !== 'All') return false;
        if (metric === 'Beta' && d.asset === benchmarkName) return false; // Exclude benchmark for Beta
        return d[metric] !== null; // Exclude entries where metric is null
    })
    .map(item => ({
      name: item.asset,
      value: item[metric] ?? 0
    }))
    .sort((a,b) => b.value - a.value);

  const isPercentage = metric === 'Total Return' || metric === 'Max Drawdown';

  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formattedValue = isPercentage
        ? `${(Number(value) * 100).toFixed(2)}%`
        : Number(value).toFixed(2);
      return (
        <div className="bg-background-light p-2 border border-gray-700 rounded-md shadow-lg">
          <p className="font-bold text-text-primary">{label}</p>
          <p className="text-sm" style={{ color: payload[0].payload.fill }}>
            {`${metric}: ${formattedValue}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const nameMap: Record<string, string> = {
    'Total Return': '#34d399',
    'Sharpe Ratio': '#2dd4bf',
    'Max Drawdown': '#f87171',
    'Beta': '#a78bfa'
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" horizontal={false} />
        <XAxis 
          type="number" 
          stroke="#9ca3af" 
          tickFormatter={isPercentage ? (tick) => `${(tick * 100).toFixed(0)}%` : (tick) => tick.toFixed(1)}
          domain={metric === 'Max Drawdown' ? ['dataMin - 0.05', 0] : (metric === 'Beta' ? ['auto', 'auto'] : ['auto', 'auto'])}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
            type="category" 
            dataKey="name" 
            stroke="#9ca3af" 
            width={80} 
            tick={{ fontSize: 12 }} 
            axisLine={false} 
            tickLine={false}
        />
        <Tooltip cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }} content={<CustomTooltipContent />} />
        {metric === 'Beta' && (
            <ReferenceLine x={1} stroke="#a3a3a3" strokeDasharray="4 4" label={{ value: "Benchmark", position: "insideTopRight", fill: "#a3a3a3", fontSize: 12 }} />
        )}
        <Bar dataKey="value" name={metric} radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => {
                let color = nameMap[metric] || COLORS[index % COLORS.length];
                if (metric === 'Total Return' && entry.value < 0) color = '#ef4444';
                 return <Cell key={`cell-${index}`} fill={color} />;
            })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OverallMetricChart;
