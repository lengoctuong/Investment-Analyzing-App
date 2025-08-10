
import React, { useMemo } from 'react';
import { ProcessedMetrics } from '../types';

interface MetricsTableProps {
  data: ProcessedMetrics[];
  assetNames: string[];
  benchmarkName: string;
}

const SimpleInlineBar: React.FC<{ value: number; min: number; max: number; isPositiveGood: boolean; }> = ({ value, min, max, isPositiveGood }) => {
    const range = max - min;
    if (range <= 0) return null;
    const percentage = Math.max(0, Math.min(100, ((value - min) / range) * 100));
    
    let color = '#3b82f6'; // Neutral color
    if (isPositiveGood) {
        color = value >= 0 ? '#14b8a6' : '#ef4444';
    } else {
        // For metrics where lower is better (Max Drawdown)
        color = '#ef4444';
    }

    return (
        <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-1.5">
            <div
                className="h-1.5 rounded-full"
                style={{ width: `${percentage}%`, backgroundColor: color }}
            ></div>
        </div>
    );
};


const MetricsTable: React.FC<MetricsTableProps> = ({ data, assetNames, benchmarkName }) => {
  const assets = [...assetNames, benchmarkName].filter((v, i, a) => a.indexOf(v) === i); // Unique list of all assets, benchmark last.
  const periods = [...new Set(data.map(item => item.year))].sort((a, b) => {
      if (a === 'All') return 1;
      if (b === 'All') return -1;
      return a.localeCompare(b);
  });
  
  const metricsOrder: (keyof Omit<ProcessedMetrics, 'year' | 'asset'>)[] = ['Total Return', 'Sharpe Ratio', 'Max Drawdown', 'Beta'];

  const metricRanges = useMemo(() => {
    const ranges: Record<string, { min: number, max: number }> = {};
    metricsOrder.forEach(metric => {
        const values = data
            .filter(d => d[metric] !== null && typeof d[metric] === 'number')
            .map(d => d[metric] as number);
        if (values.length > 0) {
            ranges[metric] = {
                min: Math.min(...values),
                max: Math.max(...values)
            };
        }
    });
    return ranges;
  }, [data, metricsOrder]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-text-primary sm:pl-6 w-48">Metric / Asset</th>
            {periods.map(period => (
              <th key={period} scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-text-primary">{period}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-card-dark">
          {metricsOrder.map(metric => (
            <React.Fragment key={metric}>
              <tr className="border-t border-gray-700 bg-gray-800/50">
                <td colSpan={periods.length + 1} className="whitespace-nowrap py-2 pl-4 pr-3 text-base font-medium text-brand-primary sm:pl-6">
                  {metric}
                </td>
              </tr>
              {assets.map(asset => {
                if (metric === 'Beta' && asset === benchmarkName) {
                  return null;
                }
                return (
                  <tr key={`${asset}-${metric}`}>
                    <td className="whitespace-nowrap py-4 pl-8 pr-3 text-sm font-medium text-text-secondary sm:pl-10">{asset}</td>
                    {periods.map(period => {
                      const item = data.find(d => d.asset === asset && d.year === period);
                      const value = item ? item[metric as keyof typeof item] : null;
                      const isPercentage = ['Total Return', 'Max Drawdown'].includes(metric);
                      
                      let valueClass = 'text-text-primary';
                      if (typeof value === 'number' && isPercentage) {
                        if (metric === 'Max Drawdown') {
                            valueClass = 'text-red-400';
                        } else {
                            valueClass = value >= 0 ? 'text-green-400' : 'text-red-400';
                        }
                      }
                      
                      const metricRange = metricRanges[metric];
                      const showBar = assets.length > 2 && typeof value === 'number' && metricRange;

                      return (
                        <td key={`${asset}-${period}-${metric}`} className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className='flex flex-col text-center'>
                            <span className={valueClass}>
                                {typeof value === 'number' ? (isPercentage ? `${(value * 100).toFixed(2)}%` : value.toFixed(2)) : 'N/A'}
                            </span>
                            {showBar && (
                                <SimpleInlineBar
                                    value={value}
                                    min={metricRange.min}
                                    max={metricRange.max}
                                    isPositiveGood={metric !== 'Max Drawdown'}
                                />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                )
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetricsTable;
