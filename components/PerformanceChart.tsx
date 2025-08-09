import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { ProcessedMetrics } from '../types';

interface ChartProps {
  data: ProcessedMetrics[];
}

const PerformanceChart: React.FC<ChartProps> = ({ data }) => {
  const assets = [...new Set(data.map(item => item.asset))];
  const chartData = [...new Set(data.map(item => item.year))].map(year => {
    const yearData: { [key: string]: string | number } = { year };
    assets.forEach(asset => {
      const assetData = data.find(d => d.year === year && d.asset === asset);
      yearData[asset] = assetData ? assetData['Sharpe Ratio'] : 0;
    });
    return yearData;
  });

  const colors = ['#14b8a6', '#f97316'];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
        <XAxis dataKey="year" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" tickFormatter={(tick) => tick.toFixed(2)} />
        <Tooltip
          cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
          contentStyle={{
            backgroundColor: '#1f2937',
            borderColor: '#4b5563',
            color: '#f9fafb'
          }}
          formatter={(value: number) => [value.toFixed(2), 'Sharpe Ratio']}
        />
        <Legend />
        {assets.map((asset, index) => (
          <Bar key={asset} dataKey={asset} name={asset} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;