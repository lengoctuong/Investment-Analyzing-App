import React from 'react';
import { ProcessedMetrics } from '../types';

interface MetricsTableProps {
  data: ProcessedMetrics[];
  assetName: string;
  benchmarkName: string;
}

const MetricsTable: React.FC<MetricsTableProps> = ({ data, assetName, benchmarkName }) => {
  const assets = [assetName, benchmarkName];
  const periods = [...new Set(data.map(item => item.year))].sort((a, b) => {
      if (a === 'All') return 1;
      if (b === 'All') return -1;
      return a.localeCompare(b);
  });
  
  const metricsOrder: (keyof Omit<ProcessedMetrics, 'year' | 'asset'>)[] = ['Total Return', 'Sharpe Ratio', 'Max Drawdown', 'Beta'];

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
              {assets.map(asset => (
                <tr key={`${asset}-${metric}`}>
                  <td className="whitespace-nowrap py-4 pl-8 pr-3 text-sm font-medium text-text-secondary sm:pl-10">{asset}</td>
                  {periods.map(period => {
                    const item = data.find(d => d.asset === asset && d.year === period);
                    const value = item ? item[metric as keyof typeof item] : null;
                    const isPercentage = ['Total Return', 'Max Drawdown'].includes(metric);
                    const valueClass = typeof value === 'number' && isPercentage 
                      ? (value >= 0 ? 'text-green-400' : 'text-red-400')
                      : 'text-text-secondary';

                    return (
                      <td key={`${asset}-${period}-${metric}`} className={`whitespace-nowrap px-3 py-4 text-sm text-center ${valueClass}`}>
                        {typeof value === 'number' ? (isPercentage ? `${(value * 100).toFixed(2)}%` : value.toFixed(2)) : 'N/A'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetricsTable;