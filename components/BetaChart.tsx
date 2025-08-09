import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { ProcessedMetrics } from '../types';

interface ChartProps {
  data: ProcessedMetrics[];
}

const BetaChart: React.FC<ChartProps> = ({ data }) => {
  // Only show Beta for the fund, as benchmark's beta against itself is not a useful metric to chart.
  const fundData = data.filter(d => d.asset === 'Asset');

  const chartData = [...new Set(fundData.map(item => item.year))].map(year => {
    const assetData = fundData.find(d => d.year === year);
    return {
      year,
      'Asset': assetData ? assetData['Beta'] : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
        <XAxis dataKey="year" stroke="#9ca3af" />
        <YAxis
          stroke="#9ca3af"
          tickFormatter={(tick) => tick.toFixed(2)}
        />
        <Tooltip
          cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
          contentStyle={{
            backgroundColor: '#1f2937',
            borderColor: '#4b5563',
            color: '#f9fafb'
          }}
          formatter={(value: number) => [value !== null ? value.toFixed(2) : 'N/A', 'Beta']}
        />
        <Legend />
        <Bar dataKey="Asset" fill={'#818cf8'} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BetaChart;