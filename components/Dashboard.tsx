
import React from 'react';
import { ProcessedMetrics } from '../types';
import ReturnChart from './ReturnChart';
import MetricsTable from './MetricsTable';
import Card from './Card';
import PerformanceChart from './PerformanceChart';
import MaxDrawdownChart from './MaxDrawdownChart';
import BetaChart from './BetaChart';
import OverallMetricChart from './OverallMetricChart';

interface DashboardProps {
  performanceData: ProcessedMetrics[];
  overallMetrics: ProcessedMetrics[];
  groupBy: 'year' | 'month';
  assetNames: string[];
  benchmarkName: string;
  colorMap: Map<string, string>;
}

const Dashboard: React.FC<DashboardProps> = ({ performanceData, overallMetrics, groupBy, assetNames, benchmarkName, colorMap }) => {
  const fundOverall = overallMetrics.find(m => m.asset === assetNames[0]);
  const benchmarkOverall = overallMetrics.find(m => m.asset === benchmarkName);
  
  const isMultiAsset = assetNames.length > 1;

  const periods = [...new Set(performanceData.filter(d => d.year !== 'All').map(d => d.year))].sort((a,b) => a.localeCompare(b));
  const lastNPeriods = periods.slice(groupBy === 'year' ? -10 : -36);
  const chartData = performanceData.filter(d => lastNPeriods.includes(d.year));

  const renderSingleAssetOverview = () => (
    <>
      <div>
        <h3 className="text-xl font-semibold text-text-primary mb-4">{assetNames[0]}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <h4 className="text-text-secondary text-sm font-medium">Total Return</h4>
            <p className={`text-3xl font-bold ${fundOverall && fundOverall['Total Return'] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fundOverall ? `${(fundOverall['Total Return'] * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </Card>
          <Card>
            <h4 className="text-text-secondary text-sm font-medium">Sharpe Ratio</h4>
            <p className="text-3xl font-bold text-teal-400">
              {fundOverall ? fundOverall['Sharpe Ratio'].toFixed(2) : 'N/A'}
            </p>
          </Card>
          <Card>
            <h4 className="text-text-secondary text-sm font-medium">Max Drawdown</h4>
            <p className={`text-3xl font-bold text-red-400`}>
              {fundOverall ? `${(fundOverall['Max Drawdown'] * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </Card>
          <Card>
            <h4 className="text-text-secondary text-sm font-medium">Beta</h4>
            <p className="text-3xl font-bold text-indigo-400">
              {fundOverall && fundOverall['Beta'] !== null ? fundOverall['Beta'].toFixed(2) : 'N/A'}
            </p>
          </Card>
        </div>
      </div>
       <div>
        <h3 className="text-xl font-semibold text-text-primary mb-4 mt-6">{benchmarkName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <h4 className="text-text-secondary text-sm font-medium">Total Return</h4>
            <p className={`text-3xl font-bold ${benchmarkOverall && benchmarkOverall['Total Return'] >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {benchmarkOverall ? `${(benchmarkOverall['Total Return'] * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </Card>
          <Card>
            <h4 className="text-text-secondary text-sm font-medium">Sharpe Ratio</h4>
            <p className="text-3xl font-bold text-teal-400">
              {benchmarkOverall ? benchmarkOverall['Sharpe Ratio'].toFixed(2) : 'N/A'}
            </p>
          </Card>
          <Card>
            <h4 className="text-text-secondary text-sm font-medium">Max Drawdown</h4>
            <p className={`text-3xl font-bold text-red-400`}>
              {benchmarkOverall ? `${(benchmarkOverall['Max Drawdown'] * 100).toFixed(2)}%` : 'N/A'}
            </p>
          </Card>
          <Card>
            <h4 className="text-text-secondary text-sm font-medium">Beta</h4>
            <p className="text-3xl font-bold text-indigo-400">
              {/* Benchmark Beta is always 1, not shown */ 'N/A'}
            </p>
          </Card>
        </div>
      </div>
    </>
  );

  const renderMultiAssetOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Overall Total Return</h3>
        <OverallMetricChart data={overallMetrics} metric="Total Return" />
      </Card>
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Overall Sharpe Ratio</h3>
        <OverallMetricChart data={overallMetrics} metric="Sharpe Ratio" />
      </Card>
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Overall Max Drawdown</h3>
        <OverallMetricChart data={overallMetrics} metric="Max Drawdown" />
      </Card>
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Overall Beta</h3>
        <OverallMetricChart data={overallMetrics} metric="Beta" benchmarkName={benchmarkName}/>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 mt-8">
      <h2 className="text-3xl font-bold text-text-primary tracking-tight">Performance Overview</h2>
      
      {isMultiAsset ? renderMultiAssetOverview() : renderSingleAssetOverview()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Total Return by {groupBy === 'year' ? 'Year' : 'Month'}</h3>
          <ReturnChart data={chartData} assetNames={assetNames} benchmarkName={benchmarkName} colorMap={colorMap} />
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Sharpe Ratio by {groupBy === 'year' ? 'Year' : 'Month'}</h3>
          <PerformanceChart data={chartData} assetNames={assetNames} benchmarkName={benchmarkName} colorMap={colorMap} />
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Max Drawdown by {groupBy === 'year' ? 'Year' : 'Month'}</h3>
          <MaxDrawdownChart data={chartData} assetNames={assetNames} benchmarkName={benchmarkName} colorMap={colorMap} />
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Beta by {groupBy === 'year' ? 'Year' : 'Month'}</h3>
          <BetaChart data={chartData} assetNames={assetNames} benchmarkName={benchmarkName} colorMap={colorMap} />
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Detailed Metrics</h3>
        <MetricsTable data={performanceData} assetNames={assetNames} benchmarkName={benchmarkName} />
      </Card>
    </div>
  );
};

export default Dashboard;
