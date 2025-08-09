import React, { useState, useEffect, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import FilterControls from './components/FilterControls';
import DataSourceControls from './components/DataSourceControls';
import { TimeSeriesData, ProcessedMetrics } from './types';
import { calculatePerformanceMetrics } from './services/performanceCalculator';

const App: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<ProcessedMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start with false
  const [error, setError] = useState<string | null>(null);
  
  // State to check if data has been loaded by the user
  const [dataLoaded, setDataLoaded] = useState(false);

  // State for the full dataset
  const [fullFundData, setFullFundData] = useState<TimeSeriesData[]>([]);
  const [fullBenchmarkData, setFullBenchmarkData] = useState<TimeSeriesData[]>([]);

  // State for filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'year' | 'month'>('year');
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  const handleDataLoaded = (
    fundData: TimeSeriesData[], 
    benchmarkData: TimeSeriesData[], 
    minDateStr: string, 
    maxDateStr: string
  ) => {
    setFullFundData(fundData);
    setFullBenchmarkData(benchmarkData);
    setMinDate(minDateStr);
    setMaxDate(maxDateStr);
    setStartDate(minDateStr);
    setEndDate(maxDateStr);
    setDataLoaded(true);
  };

  // Effect to recalculate metrics when filters or grouping change
  useEffect(() => {
    if (!dataLoaded || !fullFundData.length || !fullBenchmarkData.length || !startDate || !endDate) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use a timeout to allow the UI to update to the loading state before the heavy calculation starts
    const timer = setTimeout(() => {
        try {
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');

            const filteredFundData = fullFundData.filter(d => d.timestamp >= start && d.timestamp <= end);
            const filteredBenchmarkData = fullBenchmarkData.filter(d => d.timestamp >= start && d.timestamp <= end);

            const assets: { name: string; data: TimeSeriesData[] }[] = [
            { name: 'Asset', data: filteredFundData },
            { name: 'Benchmark', data: filteredBenchmarkData },
            ];

            const allMetrics: ProcessedMetrics[] = [];
            
            assets.forEach(asset => {
              const metrics = calculatePerformanceMetrics(asset.data, filteredBenchmarkData, groupBy);
              for (const period in metrics) {
                  allMetrics.push({
                  year: period, // Keep prop name 'year', but it represents a period (year or month)
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
    }, 50); // 50ms timeout

    return () => clearTimeout(timer);

  }, [dataLoaded, startDate, endDate, groupBy, fullFundData, fullBenchmarkData]);


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
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
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
                <FilterControls
                    startDate={startDate}
                    endDate={endDate}
                    groupBy={groupBy}
                    minDate={minDate}
                    maxDate={maxDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    setGroupBy={setGroupBy}
                />
                <Dashboard performanceData={performanceData} overallMetrics={overallMetrics} groupBy={groupBy} />
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