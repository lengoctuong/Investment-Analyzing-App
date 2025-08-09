import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import FilterControls from './components/FilterControls';
import DataSourceControls from './components/DataSourceControls';
import PriceChart from './components/PriceChart';
import { TimeSeriesData, ProcessedMetrics, DataSource } from './types';
import { calculatePerformanceMetrics } from './services/performanceCalculator';
import { fetchDefaultBenchmarkData, fetchYahooFinanceData, fetchVNStockData } from './services/apiService';

type TimeRange = 'ytd' | '3m' | '6m' | '1y' | '3y' | '5y' | 'max';

const getMinMaxDates = (data: TimeSeriesData[]): { minDate: string, maxDate: string } => {
    if (data.length === 0) return { minDate: '', maxDate: '' };
    const dates = data.map(d => d.timestamp);
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    return { 
        minDate: min.toISOString().split('T')[0], 
        maxDate: max.toISOString().split('T')[0] 
    };
};


const App: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<ProcessedMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [dataLoaded, setDataLoaded] = useState(false);

  const [fullFundData, setFullFundData] = useState<TimeSeriesData[]>([]);
  const [fullBenchmarkData, setFullBenchmarkData] = useState<TimeSeriesData[]>([]);
  
  const [assetName, setAssetName] = useState('Asset');
  const [benchmarkName, setBenchmarkName] = useState('Benchmark');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'year' | 'month'>('year');
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange | 'custom'>('ytd');

  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [ticker, setTicker] = useState<string>('');

  const handleDataLoaded = useCallback((
    fundData: TimeSeriesData[], 
    benchmarkData: TimeSeriesData[], 
    minDateStr: string, 
    maxDateStr: string,
    asset: string,
    benchmark: string,
    source?: DataSource,
    tickerSymbol?: string,
  ) => {
    setFullFundData(fundData);
    setFullBenchmarkData(benchmarkData);
    setMinDate(minDateStr);
    setMaxDate(maxDateStr);
    setStartDate(minDateStr); 
    setEndDate(maxDateStr);
    setAssetName(asset);
    setBenchmarkName(benchmark);
    if(source) setDataSource(source);
    if(tickerSymbol) setTicker(tickerSymbol);
    setActiveTimeRange('max');
    setDataLoaded(true);
  }, []);

  const handleSetTimeRange = useCallback((range: TimeRange) => {
    if (!dataLoaded || !fullFundData.length) return;
    
    const lastDate = new Date(maxDate + 'T23:59:59');
    let newStartDate: Date;

    switch (range) {
      case 'ytd':
        newStartDate = new Date(lastDate.getFullYear(), 0, 1);
        break;
      case '3m':
        newStartDate = new Date(lastDate);
        newStartDate.setMonth(newStartDate.getMonth() - 3);
        break;
      case '6m':
        newStartDate = new Date(lastDate);
        newStartDate.setMonth(newStartDate.getMonth() - 6);
        break;
      case '1y':
        newStartDate = new Date(lastDate);
        newStartDate.setFullYear(newStartDate.getFullYear() - 1);
        break;
      case '3y':
        newStartDate = new Date(lastDate);
        newStartDate.setFullYear(newStartDate.getFullYear() - 3);
        break;
      case '5y':
        newStartDate = new Date(lastDate);
        newStartDate.setFullYear(newStartDate.getFullYear() - 5);
        break;
      case 'max':
      default:
        newStartDate = new Date(minDate + 'T00:00:00');
        break;
    }
    
    const overallMinDate = new Date(minDate + 'T00:00:00');
    if (newStartDate < overallMinDate) {
        newStartDate = overallMinDate;
    }

    const newStartDateStr = newStartDate.toISOString().split('T')[0];
    const newEndDateStr = maxDate;
    
    setStartDate(newStartDateStr);
    setEndDate(newEndDateStr);
    setActiveTimeRange(range);
  }, [dataLoaded, fullFundData.length, minDate, maxDate]);


  const handleDatesSet = useCallback(async (start: string, end: string) => {
    let finalStart = start;
    let finalEnd = end;
    
    const isApiSource = dataSource === 'yfinance' || dataSource === 'vnstock_fund' || dataSource === 'vnstock_stock';

    if (isApiSource && ticker && (start < minDate || end > maxDate)) {
        setIsLoading(true);
        setError(null);
        try {
            let newFundData: TimeSeriesData[];
            if (dataSource === 'yfinance') {
                 newFundData = await fetchYahooFinanceData(ticker, start, end);
            } else { // vnstock
                 newFundData = await fetchVNStockData(ticker, start, end, dataSource === 'vnstock_fund');
            }
           
            const newBenchmarkData = await fetchDefaultBenchmarkData(start, end);
            
            if (newFundData.length > 0) {
                const { minDate: newMin, maxDate: newMax } = getMinMaxDates(newFundData);
                handleDataLoaded(
                    newFundData, newBenchmarkData, newMin, newMax, 
                    assetName, benchmarkName, dataSource, ticker
                );
                setStartDate(start > newMin ? start : newMin);
                setEndDate(end < newMax ? end : newMax);
            } else {
                throw new Error("No data found for the new date range.");
            }
        } catch(e) {
            if (e instanceof Error) setError(e.message);
            setStartDate(minDate);
            setEndDate(maxDate);
        } finally {
            setIsLoading(false);
        }
    } else {
        if (start < minDate) finalStart = minDate;
        if (end > maxDate) finalEnd = maxDate;
        if (finalStart > finalEnd) {
            finalStart = finalEnd;
        }
        setStartDate(finalStart);
        setEndDate(finalEnd);
    }
}, [dataSource, ticker, minDate, maxDate, assetName, benchmarkName, handleDataLoaded]);


  useEffect(() => {
    if (!dataLoaded) return;
    // This check is to satisfy TypeScript, as activeTimeRange can be 'custom'
    // but handleSetTimeRange only accepts TimeRange. In practice, when this
    // effect runs due to dataLoaded changing, activeTimeRange will be a valid TimeRange.
    if (activeTimeRange !== 'custom') {
      handleSetTimeRange(activeTimeRange);
    }
  }, [dataLoaded, handleSetTimeRange]);

  useEffect(() => {
    if (!dataLoaded) return;

    const lastDate = new Date(maxDate + 'T23:59:59');
    let matchedRange: TimeRange | 'custom' = 'custom';
    
    if (endDate === maxDate) {
        const presets: TimeRange[] = ['ytd', '3m', '6m', '1y', '3y', '5y', 'max'];
        for (const range of presets) {
            let expectedStartDate: Date;
            switch (range) {
                case 'ytd':
                    expectedStartDate = new Date(lastDate.getFullYear(), 0, 1);
                    break;
                case '3m':
                    expectedStartDate = new Date(lastDate);
                    expectedStartDate.setMonth(expectedStartDate.getMonth() - 3);
                    break;
                case '6m':
                    expectedStartDate = new Date(lastDate);
                    expectedStartDate.setMonth(expectedStartDate.getMonth() - 6);
                    break;
                case '1y':
                    expectedStartDate = new Date(lastDate);
                    expectedStartDate.setFullYear(expectedStartDate.getFullYear() - 1);
                    break;
                case '3y':
                    expectedStartDate = new Date(lastDate);
                    expectedStartDate.setFullYear(expectedStartDate.getFullYear() - 3);
                    break;
                case '5y':
                    expectedStartDate = new Date(lastDate);
                    expectedStartDate.setFullYear(expectedStartDate.getFullYear() - 5);
                    break;
                case 'max':
                default:
                    expectedStartDate = new Date(minDate + 'T00:00:00');
                    break;
            }
            const overallMinDate = new Date(minDate + 'T00:00:00');
            if (expectedStartDate < overallMinDate) {
                expectedStartDate = overallMinDate;
            }
            
            if (startDate === expectedStartDate.toISOString().split('T')[0]) {
                matchedRange = range;
                break;
            }
        }
    }

    if (activeTimeRange !== matchedRange) {
        setActiveTimeRange(matchedRange);
    }
  }, [startDate, endDate, minDate, maxDate, dataLoaded, activeTimeRange]);


  const { chartFundData, chartBenchmarkData } = useMemo(() => {
    if (!dataLoaded || !fullFundData.length || !startDate || !endDate) {
        return { chartFundData: [], chartBenchmarkData: [] };
    }
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    const filteredFund = fullFundData.filter(d => d.timestamp >= start && d.timestamp <= end);
    const filteredBenchmark = fullBenchmarkData.filter(d => d.timestamp >= start && d.timestamp <= end);

    return { chartFundData: filteredFund, chartBenchmarkData: filteredBenchmark };
  }, [dataLoaded, fullFundData, fullBenchmarkData, startDate, endDate]);

  useEffect(() => {
    if (!chartFundData.length) {
      setPerformanceData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
        try {
            const assets: { name: string; data: TimeSeriesData[] }[] = [
              { name: assetName, data: chartFundData },
              { name: benchmarkName, data: chartBenchmarkData },
            ];
            
            const allMetrics: ProcessedMetrics[] = [];
            
            assets.forEach(asset => {
              const metrics = calculatePerformanceMetrics(asset.data, chartBenchmarkData, groupBy);
              for (const period in metrics) {
                  allMetrics.push({
                  year: period,
                  asset: asset.name,
                  ...metrics[period],
                  });
              }
            });
            
            allMetrics.sort((a, b) => {
                if (a.year === 'All') return 1;
                if (b.year === 'All') return -1;
                return a.year.localeCompare(b.year);
            });

            setPerformanceData(allMetrics);
            
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred.');
            }
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, 50);

    return () => clearTimeout(timer);

  }, [chartFundData, chartBenchmarkData, groupBy, assetName, benchmarkName]);


  const overallMetrics = useMemo(() => {
    return performanceData.filter(d => d.year === 'All');
  }, [performanceData]);

  const renderContent = () => {
    if (isLoading) {
       return (
         <div className="flex justify-center items-center h-64 mt-8">
            <div role="status" className="flex flex-col items-center">
                <svg aria-hidden="true" className="w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-brand-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.22158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <p className="text-text-secondary text-xl mt-4">Processing Data...</p>
            </div>
          </div>
       );
    }
    if (error) {
       return (
           <div className="flex justify-center items-center h-64 mt-8">
            <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-red-400">Error Loading Data</h3>
                <p className="mt-1 text-sm text-text-secondary">{error}</p>
                 <button onClick={() => { setDataLoaded(false); setError(null); }} className="mt-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-md">
                    Try Again
                </button>
            </div>
          </div>
       );
    }
    if (dataLoaded) {
        return (
            <>
                <PriceChart 
                    fundData={chartFundData} 
                    benchmarkData={chartBenchmarkData} 
                    assetName={assetName} 
                    benchmarkName={benchmarkName}
                    activeTimeRange={activeTimeRange}
                    setActiveTimeRange={handleSetTimeRange}
                />
                <FilterControls
                    startDate={startDate}
                    endDate={endDate}
                    groupBy={groupBy}
                    minDate={minDate}
                    maxDate={maxDate}
                    onDatesChange={handleDatesSet}
                    setGroupBy={setGroupBy}
                />
                <Dashboard 
                    performanceData={performanceData} 
                    overallMetrics={overallMetrics} 
                    groupBy={groupBy}
                    assetName={assetName}
                    benchmarkName={benchmarkName}
                />
            </>
        );
    }
    return <DataSourceControls onDataLoaded={handleDataLoaded} setIsLoading={setIsLoading} setError={setError} />;
  }

  return (
    <div className="min-h-screen bg-background-dark font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;