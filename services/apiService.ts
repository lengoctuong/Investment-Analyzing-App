import { TimeSeriesData, DCResponse } from '../types';
import { parseDCData } from './dataService';

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

export const fetchYahooFinanceData = async (ticker: string, start: string, end: string): Promise<TimeSeriesData[]> => {
    const formattedStart = formatDateToDDMMYYYY(start);
    const formattedEnd = formatDateToDDMMYYYY(end);
    
    const params = new URLSearchParams({
        ticker: ticker.toUpperCase(),
    });

    if(formattedStart) params.append('start', formattedStart);
    if(formattedEnd) params.append('end', formattedEnd);

    const url = `http://localhost:8000/api/yfinance?${params.toString()}`;
    
    try {
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch Yahoo Finance data for ${ticker}: ${res.statusText} - ${errorText}`);
        }

        const rawData: {timestamp: string, value: number}[] = await res.json();
        const isVnStock = ticker.toUpperCase().endsWith('.VN');
        
        return rawData
          .map(d => {
              let value = d.value;
              // Normalize VN stock values from yfinance (VND) to match vnstock (thousands of VND)
              if (isVnStock) {
                  value /= 1000;
              }
              return {
                  timestamp: new Date(d.timestamp),
                  value: value
              };
          })
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    } catch (e) {
        if (e instanceof Error) {
            console.error(e.message);
            throw new Error(`Could not connect to the backend API service. Please ensure it's running. Details: ${e.message}`);
        }
        throw e;
    }
};

// Updated to fetch benchmark from the new API
export const fetchDefaultBenchmarkData = async (start: string, end: string): Promise<TimeSeriesData[]> => {
    return fetchVNStockData('VNINDEX', start, end, false);
};