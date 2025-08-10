
import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { Asset } from '../types';
import Card from './Card';

type TimeRange = 'ytd' | '3m' | '6m' | '1y' | '3y' | '5y' | 'max';

interface PriceChartProps {
  assets: Asset[];
  benchmark: Asset;
  activeTimeRange: TimeRange | 'custom';
  setActiveTimeRange: (range: TimeRange) => void;
  colorMap: Map<string, string>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formatValue = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return (
        <div className="bg-background-light p-4 border border-gray-700 rounded-md shadow-lg text-sm">
          <p className="label text-text-primary font-bold mb-2">{`${label}`}</p>
          {payload.map((p: any) => (
            p.payload[`${p.dataKey}_raw`] !== undefined && p.payload[`${p.dataKey}_raw`] !== null ? (
              <p key={p.dataKey} className="intro" style={{ color: p.color }}>
                {`${p.dataKey}: ${formatValue(p.payload[`${p.dataKey}_raw`])} (${formatValue(p.value - 100)}%)`}
              </p>
            ) : null
          ))}
        </div>
      );
    }

    return null;
};


const PriceChart: React.FC<PriceChartProps> = ({ assets, benchmark, activeTimeRange, setActiveTimeRange, colorMap }) => {
  const allAssets = useMemo(() => [...assets, benchmark], [assets, benchmark]);
  const [visibleAssets, setVisibleAssets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (allAssets.length > 0) {
        const initialVisibility: Record<string, boolean> = {};
        allAssets.forEach(asset => {
            initialVisibility[asset.name] = true;
        });
        setVisibleAssets(initialVisibility);
    }
  }, [allAssets]);

  const toggleAssetVisibility = (assetName: string) => {
    setVisibleAssets(prev => ({ ...prev, [assetName]: !prev[assetName] }));
  };

  const chartData = useMemo(() => {
    if (allAssets.length === 0 || allAssets.every(a => a.data.length === 0)) return [];

    const baseValues = new Map<string, number>();
    allAssets.forEach(asset => {
        if (asset && asset.data.length > 0) {
            baseValues.set(asset.name, asset.data[0].value);
        }
    });

    const combinedData = new Map<string, { [key: string]: number | string }>();
    const mainAsset = allAssets.reduce((prev, current) => (prev.data.length > current.data.length) ? prev : current);

    mainAsset.data.forEach(point => {
        const dateKey = point.timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        combinedData.set(dateKey, { date: dateKey });
    });

    allAssets.forEach(asset => {
        if (!asset) return;
        const assetMap = new Map(asset.data.map(d => [d.timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), d.value]));
        const baseValue = baseValues.get(asset.name);
        
        if (baseValue) {
            for (const dateKey of combinedData.keys()) {
                const entry = combinedData.get(dateKey)!;
                const value = assetMap.get(dateKey);
                entry[`${asset.name}_raw`] = value ?? null;
                entry[asset.name] = value ? (value / baseValue) * 100 : null;
            }
        }
    });

    return Array.from(combinedData.values()).sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime());

  }, [allAssets]);
  
  const renderLegend = () => {
      return (
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4">
          {allAssets.map((asset) => {
            const assetName = asset.name;
            const color = colorMap.get(assetName) || '#ccc';
            const isVisible = visibleAssets[assetName];
            return (
              <button
                key={`item-${assetName}`}
                onClick={() => toggleAssetVisibility(assetName)}
                className={`flex items-center text-sm cursor-pointer transition-opacity ${!isVisible ? 'opacity-50' : ''}`}
                aria-label={`Toggle visibility of ${assetName}`}
              >
                <span className="w-4 h-1 mr-2 rounded-full" style={{ backgroundColor: color }}></span>
                <span className="text-text-secondary hover:text-text-primary">{assetName}</span>
              </button>
            );
          })}
        </div>
      );
  };

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
                      Custom
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
            content={<CustomTooltip />}
          />
          <Legend content={renderLegend} />
          {allAssets.map((asset) => (
             visibleAssets[asset.name] && <Line key={asset.name} type="monotone" dataKey={asset.name} stroke={colorMap.get(asset.name) || '#ccc'} strokeWidth={2} dot={false} connectNulls aria-label={`${asset.name} price trend`} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default PriceChart;
