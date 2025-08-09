import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { TimeSeriesData } from '../types';
import Card from './Card';

type TimeRange = 'ytd' | '3m' | '6m' | '1y' | '3y' | '5y' | 'max';

interface PriceChartProps {
  fundData: TimeSeriesData[];
  benchmarkData: TimeSeriesData[];
  assetName: string;
  benchmarkName: string;
  activeTimeRange: TimeRange | 'custom';
  setActiveTimeRange: (range: TimeRange) => void;
}

const CustomTooltip = ({ active, payload, label, assetName, benchmarkName }: any) => {
    if (active && payload && payload.length) {
      const assetPayload = payload.find((p: any) => p.dataKey === assetName);
      const benchmarkPayload = payload.find((p: any) => p.dataKey === benchmarkName);

      const formatValue = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return (
        <div className="bg-background-light p-4 border border-gray-700 rounded-md shadow-lg text-sm">
          <p className="label text-text-primary font-bold mb-2">{`${label}`}</p>
          {assetPayload && (
            <p className="intro" style={{ color: assetPayload.color }}>
              {`${assetName}: ${formatValue(assetPayload.payload[`${assetName}_raw`])} (${formatValue(assetPayload.value - 100)}%)`}
            </p>
          )}
          {benchmarkPayload && benchmarkPayload.payload[`${benchmarkName}_raw`] !== null && (
             <p className="intro" style={{ color: benchmarkPayload.color }}>
              {`${benchmarkName}: ${formatValue(benchmarkPayload.payload[`${benchmarkName}_raw`])} (${formatValue(benchmarkPayload.value - 100)}%)`}
            </p>
          )}
        </div>
      );
    }

    return null;
};


const PriceChart: React.FC<PriceChartProps> = ({ fundData, benchmarkData, assetName, benchmarkName, activeTimeRange, setActiveTimeRange }) => {
  const chartData = useMemo(() => {
    if (fundData.length < 1) return [];

    const fundBaseValue = fundData[0].value;
    const benchmarkBasePoint = benchmarkData.find(d => d.timestamp.getTime() === fundData[0].timestamp.getTime()) || benchmarkData[0];
    const benchmarkBaseValue = benchmarkBasePoint?.value;

    const benchmarkMap = new Map(benchmarkData.map(d => [d.timestamp.toISOString().split('T')[0], d.value]));

    return fundData.map(fundPoint => {
      const dateKey = fundPoint.timestamp.toISOString().split('T')[0];
      const benchmarkValue = benchmarkMap.get(dateKey);

      return {
        date: fundPoint.timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        [assetName]: (fundPoint.value / fundBaseValue) * 100,
        [`${assetName}_raw`]: fundPoint.value,
        [benchmarkName]: benchmarkValue && benchmarkBaseValue ? (benchmarkValue / benchmarkBaseValue) * 100 : null,
        [`${benchmarkName}_raw`]: benchmarkValue ?? null,
      };
    });
  }, [fundData, benchmarkData, assetName, benchmarkName]);

  const timeRanges: TimeRange[] = ['ytd', '3m', '6m', '1y', '3y', '5y', 'max'];

  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="text-lg font-semibold text-text-primary mb-2 sm:mb-0">Price Chart (Normalized to 100)</h3>
          <div className="flex flex-wrap gap-2">
               {activeTimeRange === 'custom' && (
                  <button
                      className="px-3 py-1 text-sm rounded-md bg-brand-primary text-white font-medium"
                      disabled
                  >
                      Your Time
                  </button>
              )}
              {timeRanges.map(range => (
                  <button
                      key={range}
                      onClick={() => setActiveTimeRange(range)}
                      className={`px-3 py-1 text-sm rounded-md transition font-medium ${
                          activeTimeRange === range
                              ? 'bg-brand-primary text-white'
                              : 'bg-background-light hover:bg-gray-700 text-text-secondary'
                      }`}
                  >
                      {range.toUpperCase()}
                  </button>
              ))}
          </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
          <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <YAxis
            stroke="#9ca3af"
            tickFormatter={(tick) => tick.toFixed(0)}
            domain={['dataMin - 10', 'dataMax + 10']}
            tick={{ fontSize: 12 }}
            aria-label="Normalized Price"
          />
           <Tooltip
            cursor={{ stroke: 'rgba(107, 114, 128, 0.5)', strokeWidth: 1 }}
            content={<CustomTooltip assetName={assetName} benchmarkName={benchmarkName} />}
          />
          <Legend />
          <Line type="monotone" dataKey={assetName} stroke="#14b8a6" strokeWidth={2} dot={false} aria-label={`${assetName} price trend`} />
          <Line type="monotone" dataKey={benchmarkName} stroke="#f97316" strokeWidth={2} dot={false} connectNulls aria-label={`${benchmarkName} price trend`} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PriceChart;