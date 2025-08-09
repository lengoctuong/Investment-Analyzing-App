import { TimeSeriesData, PerformanceMetrics } from '../types';

// Helper functions for statistical calculations
const mean = (arr: number[]): number => arr.length > 0 ? arr.reduce((acc, val) => acc + val, 0) / arr.length : 0;

const variance_pop = (arr: number[]): number => {
  if (arr.length < 1) return 0;
  const mu = mean(arr);
  const sqDiff = arr.map(a => (a - mu) ** 2).reduce((acc, val) => acc + val, 0);
  return sqDiff / arr.length;
};

const stdDev = (arr: number[]): number => {
  if (arr.length < 2) return 0;
  const mu = mean(arr);
  const diffArr = arr.map(a => (a - mu) ** 2);
  return Math.sqrt(diffArr.reduce((acc, val) => acc + val, 0) / (arr.length - 1));
};

const covariance = (arr1: number[], arr2: number[]): number => {
  if (arr1.length !== arr2.length || arr1.length < 2) return 0;
  const mean1 = mean(arr1);
  const mean2 = mean(arr2);
  let covar = 0;
  for (let i = 0; i < arr1.length; i++) {
    covar += (arr1[i] - mean1) * (arr2[i] - mean2);
  }
  return covar / (arr1.length - 1);
};

// Main performance calculation function
interface DailyReturn {
  timestamp: Date;
  returns: number;
}

interface CombinedReturn {
  timestamp: Date;
  assetReturns: number;
  benchmarkReturns: number;
}

export const calculatePerformanceMetrics = (
  assetData: TimeSeriesData[],
  benchmarkData: TimeSeriesData[],
  groupBy: 'year' | 'month',
  riskFreeRate: number = 0.0
): { [key: string]: PerformanceMetrics } => {
  console.log(assetData)
  if (assetData.length < 2) return {};

  const calculateDailyReturns = (data: TimeSeriesData[]): DailyReturn[] => {
    const returns: DailyReturn[] = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1].value > 0) {
        const dailyReturn = data[i].value / data[i - 1].value - 1;
        returns.push({ timestamp: data[i].timestamp, returns: dailyReturn });
      }
    }
    return returns;
  };
  
  const assetReturns = calculateDailyReturns(assetData);
  const benchmarkReturns = calculateDailyReturns(benchmarkData);

  const benchmarkReturnsMap = new Map(benchmarkReturns.map(item => [item.timestamp.toISOString().split('T')[0], item.returns]));
  
  const combinedReturns: CombinedReturn[] = assetReturns
    .map(ar => {
        const dateKey = ar.timestamp.toISOString().split('T')[0];
        if (benchmarkReturnsMap.has(dateKey)) {
            return {
                timestamp: ar.timestamp,
                assetReturns: ar.returns,
                benchmarkReturns: benchmarkReturnsMap.get(dateKey)!,
            };
        }
        return null;
    })
    .filter((item): item is CombinedReturn => item !== null);

  const getGroupKey = (date: Date): string => {
    if (groupBy === 'year') {
      return date.getFullYear().toString();
    } else { // 'month'
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${date.getFullYear()}-${month}`;
    }
  };


  const groupedByPeriod: { [period: string]: { values: TimeSeriesData[], returns: CombinedReturn[]} } = {};

  assetData.forEach(dp => {
    const key = getGroupKey(dp.timestamp);
    if (!groupedByPeriod[key]) {
      groupedByPeriod[key] = { values: [], returns: [] };
    }
    groupedByPeriod[key].values.push(dp);
  });
  
  combinedReturns.forEach(r => {
    const key = getGroupKey(r.timestamp);
    if (groupedByPeriod[key]) {
      groupedByPeriod[key].returns.push(r);
    }
  });


  const periodMetrics: { [key: string]: PerformanceMetrics } = {};

  const calcMetricsForGroup = (values: TimeSeriesData[], returns: CombinedReturn[]): PerformanceMetrics => {
    if (values.length < 2 || returns.length === 0) {
      return { 'Total Return': 0, 'Sharpe Ratio': 0, 'Max Drawdown': 0, 'Beta': null };
    }
    
    // Total Return
    const startValue = values[0].value;
    const endValue = values[values.length - 1].value;
    const totalReturn = (endValue / startValue) - 1;
    
    const assetReturnValues = returns.map(r => r.assetReturns);
    const benchmarkReturnValues = returns.map(r => r.benchmarkReturns);

    // Sharpe Ratio
    const dailyRf = riskFreeRate / 252;
    const excessReturns = assetReturnValues.map(r => r - dailyRf);
    const meanExcessReturn = mean(excessReturns);
    const stdDevExcessReturn = stdDev(excessReturns);
    const sharpeRatio = stdDevExcessReturn > 0 ? (meanExcessReturn / stdDevExcessReturn) * Math.sqrt(252) : 0;

    // Max Drawdown
    let peak = -Infinity;
    let maxDrawdown = 0;
    values.forEach(dp => {
      if (dp.value > peak) {
        peak = dp.value;
      }
      const drawdown = (dp.value - peak) / peak;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Beta
    let beta: number | null = null;
    if (benchmarkReturnValues.length > 1 && assetReturnValues.length > 1) {
      const covar = covariance(assetReturnValues, benchmarkReturnValues);
      const benchmarkVariance = variance_pop(benchmarkReturnValues);
      beta = benchmarkVariance > 0 ? covar / benchmarkVariance : 0;
    }
    
    return {
      'Total Return': totalReturn,
      'Sharpe Ratio': Math.max(0, sharpeRatio),
      'Max Drawdown': maxDrawdown,
      'Beta': beta
    };
  };
  
  for (const period in groupedByPeriod) {
    periodMetrics[period] = calcMetricsForGroup(groupedByPeriod[period].values, groupedByPeriod[period].returns);
  }
  
  periodMetrics['All'] = calcMetricsForGroup(assetData, combinedReturns);

  return periodMetrics;
};
