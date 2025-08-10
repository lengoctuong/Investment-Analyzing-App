
import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ReferenceLine, Label } from 'recharts';
import { ProcessedMetrics } from '../types';

interface ChartProps {
  data: ProcessedMetrics[];
  benchmarkName: string;
  assetNames: string[];
  colorMap: Map<string, string>;
}

const BetaChart: React.FC<ChartProps> = ({ data, benchmarkName, assetNames, colorMap }) => {
  const filteredData = data.filter(d => d.asset !== benchmarkName && d.Beta !== null);
  // Use the passed-in assetNames to ensure the order is correct.
  const assetsInChart = assetNames.filter(name => filteredData.some(d => d.asset === name));
  
  const chartData = [...new Set(filteredData.map(item => item.year))].map(year => {
    const yearData: { [key: string]: string | number } = { year };
    assetsInChart.forEach(asset => {
        const assetData = filteredData.find(d => d.year === year && d.asset === asset);
        yearData[asset] = assetData ? assetData['Beta'] as number : 0;
    });
    return yearData;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
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
          formatter={(value: number) => [value.toFixed(2), 'Beta']}
        />
        <Legend />
        <ReferenceLine y={1} stroke="#a3a3a3" strokeDasharray="4 4">
            <Label value="Benchmark" position="insideTopRight" fill="#a3a3a3" fontSize={12} offset={10}/>
        </ReferenceLine>
        {assetsInChart.map((asset) => (
          <Bar key={asset} dataKey={asset} name={asset} fill={colorMap.get(asset) || '#c084fc'} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BetaChart;