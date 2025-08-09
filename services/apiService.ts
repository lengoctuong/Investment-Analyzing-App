import { YahooFinanceItem, TimeSeriesData, DCResponse } from '../types';
import { parseDCData } from './dataService';

function mapYahooFinanceToTimeSeries(rawData: YahooFinanceItem[]): TimeSeriesData[] {
  return rawData.map(d => ({
    timestamp: new Date(d.date),
    value: d.adjClose ?? d.close // Prefer adjusted close for accuracy
  }));
}

// Helper to convert YYYY-MM-DD to DD-MM-YYYY for the new API
const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString || !dateString.includes('-')) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
};

// Updated to fetch from the Python backend
export const fetchVNStockData = async (ticker: string, start: string, end: string, isFund: boolean = false): Promise<TimeSeriesData[]> => {
    const formattedStart = formatDateToDDMMYYYY(start);
    const formattedEnd = formatDateToDDMMYYYY(end);
    
    const params = new URLSearchParams({
        ticker: ticker.toUpperCase(),
        is_fund: String(isFund),
    });

    if(formattedStart) params.append('start', formattedStart);
    if(formattedEnd) params.append('end', formattedEnd);

    const url = `http://localhost:8000/api/vnstock?${params.toString()}`;
    
    try {
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch VNStock data for ${ticker}: ${res.statusText} - ${errorText}`);
        }

        const rawData: {timestamp: string, value: number}[] = await res.json();
        
        return rawData
          .map(d => ({
              timestamp: new Date(d.timestamp),
              value: d.value
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    } catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
            throw new Error(`Could not connect to the backend API service. Please ensure it's running. Details: ${e.message}`);
        }
        throw e;
    }
};

export const fetchYahooFinanceData = async (ticker: string, start: string, end: string) => {
    const url = `http://localhost:3001/api/yfinance?ticker=${ticker}&start=${start}&end=${end}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch data from Yahoo Finance: ${res.statusText} - ${errorText}`);
    }

    const rawData = await res.json();
    const fundData: TimeSeriesData[] = mapYahooFinanceToTimeSeries(rawData);
    return fundData;
};

// Updated to fetch benchmark from the new API
export const fetchDefaultBenchmarkData = async (start: string, end: string): Promise<TimeSeriesData[]> => {
    return fetchVNStockData('VNINDEX', start, end, false);
};