import React, { useState } from 'react';
import Card from './Card';
import { DataSource, DCResponse, FmarketResponse, TimeSeriesData } from '../types';
import { parseDCData, parseFmarketData } from '../services/dataService';
import { fetchVNStockData, fetchYahooFinanceData, fetchDefaultBenchmarkData } from '../services/apiService';

interface DataSourceControlsProps {
  onDataLoaded: (fundData: TimeSeriesData[], benchmarkData: TimeSeriesData[], minDate: string, maxDate: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const DataSourceControls: React.FC<DataSourceControlsProps> = ({ onDataLoaded, setIsLoading, setError }) => {
    const [source, setSource] = useState<DataSource>('dc');
    const [fundFile, setFundFile] = useState<File | null>(null);
    const [ticker, setTicker] = useState<string>('BTC-USD');
    const [apiStartDate, setApiStartDate] = useState<string>('2020-01-01');
    const [apiEndDate, setApiEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFundFile(e.target.files[0]);
        }
    };
    
    const getMinMaxDates = (data: TimeSeriesData[]): { minDate: string, maxDate: string } => {
        if (data.length === 0) return { minDate: '', maxDate: '' };

        const toDate = (d: any) => {
            if (!d) return undefined;
            return d instanceof Date ? d : new Date(d);
        };

        const firstDate = toDate(data[0].timestamp);
        const lastDate = toDate(data[data.length - 1].timestamp);

        if (!firstDate || !lastDate || isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
            return { minDate: '', maxDate: '' };
        }

        const min = firstDate.toISOString().split('T')[0];
        const max = lastDate.toISOString().split('T')[0];
        return { minDate: min, maxDate: max };
    };

    const handleLoadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let fundData: TimeSeriesData[] = [];
            let benchmarkData: TimeSeriesData[] = [];
            
            switch (source) {
                case 'dc':
                    if (!fundFile) throw new Error('Please select a Dragon Capital JSON file.');
                    const dcText = await fundFile.text();
                    const dcData: DCResponse = JSON.parse(dcText);
                    const parsedDc = parseDCData(dcData);
                    fundData = parsedDc.fundData;
                    benchmarkData = parsedDc.benchmarkData;
                    break;

                case 'fmarket':
                    if (!fundFile) throw new Error('Please select an Fmarket JSON file.');
                    const fmarketText = await fundFile.text();
                    const fmarketData: FmarketResponse = JSON.parse(fmarketText);
                    fundData = parseFmarketData(fmarketData);
                    benchmarkData = await fetchDefaultBenchmarkData(); // Use default benchmark
                    break;
                
                case 'vnstock_stock':
                    if (!ticker) throw new Error('Please enter a stock ticker.');
                    fundData = await fetchVNStockData(ticker, apiStartDate, apiEndDate, false);
                    benchmarkData = await fetchDefaultBenchmarkData();
                    break;

                case 'vnstock_fund':
                    if (!ticker) throw new Error('Please enter a fund ticker.');
                    fundData = await fetchVNStockData(ticker, apiStartDate, apiEndDate, true);
                    benchmarkData = await fetchDefaultBenchmarkData();
                    break;

                case 'yfinance':
                    if (!ticker) throw new Error('Please enter a ticker.');
                    fundData = await fetchYahooFinanceData(ticker, apiStartDate, apiEndDate);
                    benchmarkData = await fetchDefaultBenchmarkData(); // Assuming VN-Index as default benchmark
                    break;
            }

            if (fundData.length === 0) {
                 throw new Error('No data found for the selected criteria. Please check your inputs.');
            }
            
            const { minDate, maxDate } = getMinMaxDates(fundData);
            onDataLoaded(fundData, benchmarkData, minDate, maxDate);

        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred while loading data.');
            }
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const renderInputs = () => {
        switch (source) {
            case 'dc':
            case 'fmarket':
                return (
                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-text-secondary mb-1">
                            Upload JSON File
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-secondary"
                        />
                    </div>
                );
            case 'vnstock_stock':
            case 'vnstock_fund':
            case 'yfinance':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                           <label htmlFor="ticker" className="block text-sm font-medium text-text-secondary mb-1">
                            Ticker
                           </label>
                           <input
                                type="text"
                                id="ticker"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                placeholder={source === 'yfinance' ? 'e.g., BTC-USD' : 'e.g., FPT'}
                                className="w-full bg-background-light border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2"
                           />
                        </div>
                         <div>
                            <label htmlFor="api-start-date" className="block text-sm font-medium text-text-secondary mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="api-start-date"
                                value={apiStartDate}
                                max={apiEndDate}
                                onChange={(e) => setApiStartDate(e.target.value)}
                                className="w-full bg-background-light border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2"
                            />
                        </div>
                         <div>
                            <label htmlFor="api-end-date" className="block text-sm font-medium text-text-secondary mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                id="api-end-date"
                                value={apiEndDate}
                                min={apiStartDate}
                                onChange={(e) => setApiEndDate(e.target.value)}
                                className="w-full bg-background-light border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2"
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <Card>
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary">Load Performance Data</h2>
                    <div>
                        <label htmlFor="data-source" className="block text-sm font-medium text-text-secondary mb-1">
                            Data Source
                        </label>
                        <select
                            id="data-source"
                            value={source}
                            onChange={(e) => setSource(e.target.value as DataSource)}
                            className="w-full bg-background-light border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2 appearance-none bg-no-repeat bg-right pr-8"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundSize: '1.5em 1.5em',
                            }}
                        >
                            <option value="dc">Dragon Capital (JSON)</option>
                            <option value="fmarket">Fmarket (JSON)</option>
                            <option value="vnstock_stock">VNStock API (Stock)</option>
                            <option value="vnstock_fund">VNStock API (Fund)</option>
                            <option value="yfinance">yahoo-finance2 API</option>
                        </select>
                        <p className="text-xs text-text-secondary mt-2">
                           {source.includes('api') && "Note: API sources are currently simulated using mock data."}
                           {source === 'fmarket' && "Note: Benchmark will be the default VN-Index."}
                        </p>
                    </div>

                    <div className="mt-4">
                        {renderInputs()}
                    </div>
                    
                    <div className="pt-4">
                        <button
                            onClick={handleLoadData}
                            className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300"
                        >
                            Load & Analyze Data
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default DataSourceControls;
