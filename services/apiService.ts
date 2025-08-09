import { YahooFinanceItem, DCResponse, TimeSeriesData } from '../types';
import { parseDCData } from './dataService';

let cachedFundData: TimeSeriesData[] | null = null;
let cachedBenchmarkData: TimeSeriesData[] | null = null;

function mapYahooFinanceToTimeSeries(rawData: YahooFinanceItem[]): TimeSeriesData[] {
  return rawData.map(d => ({
    timestamp: new Date(d.date),
    value: d.close // lấy giá đóng cửa
  }));
}

const getMockData = async (): Promise<{ fundData: TimeSeriesData[], benchmarkData: TimeSeriesData[] }> => {
    if (cachedFundData && cachedBenchmarkData) {
        return { fundData: cachedFundData, benchmarkData: cachedBenchmarkData };
    }
    const response = await fetch('./data/DCDS.json');
    const rawData: DCResponse = await response.json();
    const { fundData, benchmarkData } = parseDCData(rawData);
    cachedFundData = fundData;
    cachedBenchmarkData = benchmarkData;
    return { fundData, benchmarkData };
}

const filterDataByDate = (data: TimeSeriesData[], start: Date, end: Date) => {
    return data.filter(d => d.timestamp >= start && d.timestamp <= end);
};

// Simulate fetching VNStock data
export const fetchVNStockData = async (ticker: string, start: string, end: string, isFund: boolean = false): Promise<TimeSeriesData[]> => {
    console.log(`Simulating API call for ${ticker} from ${start} to ${end}`);
    // We'll use the DCDS fund data as mock for any ticker, and VN-Index for benchmark
    const { fundData, benchmarkData } = await getMockData();
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    let sourceData = fundData; // Default to fund data for any ticker
    if (ticker.toUpperCase() === 'VN-INDEX' || ticker.toUpperCase() === '^VNINDEX') {
      sourceData = benchmarkData;
    }

    let result = filterDataByDate(sourceData, startDate, endDate);

    // Apply fund-specific logic from user's python code
    if (isFund && ticker.toUpperCase() !== 'VN-INDEX') {
         // The python code shifts the value up by one day.
         result = result.map((item, index, arr) => {
            if (index < arr.length - 1) {
                return { ...item, value: arr[index + 1].value };
            }
            // For the last item, we can't shift, so we'll drop it.
            return null;
        }).filter((item): item is TimeSeriesData => item !== null);
    }

    return new Promise(resolve => setTimeout(() => resolve(result), 500)); // Simulate network delay
};

export const fetchYahooFinanceData = async (ticker: string, start: string, end: string) => {
    const url = `https://e96a09bf9b79.ngrok-free.app/api/yfinance?ticker=${ticker}&start=${start}&end=${end}`;
    const res = await fetch(url, {
      headers: { "ngrok-skip-browser-warning": "anyvalue" }
    });
    const rawData = await res.json();
    if (!res.ok) throw new Error('Failed to fetch data');

    const fundData: TimeSeriesData[] = mapYahooFinanceToTimeSeries(rawData);
    return await fundData;
  };

// export const fetchYahooFinanceData = async (ticker: string, start: string, end: string): Promise<TimeSeriesData[]> => {
//     console.log(`Fetching data for ${ticker} from ${start} to ${end} using yahoo-finance2`);
//     try {
//         const result = await yahooFinance.historical(ticker, {
//             period1: start,
//             period2: end,
//             interval: '1d',
//             includeAdjustedClose: true
//         });
//         return result
//             .filter(row => row.adjClose != null && !isNaN(row.adjClose))
//             .map(row => ({
//                 timestamp: new Date(row.date),
//                 value: row.adjClose as number,
//             }))
//             .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
//     } catch (err) {
//         console.error(`Error fetching data for ${ticker} from yahoo-finance2:`, err);
//         throw new Error(`Failed to fetch data for ${ticker} from yahoo-finance2.`);
//     }
// };

// We need a way to get the benchmark data for non-DC sources
export const fetchDefaultBenchmarkData = async (): Promise<TimeSeriesData[]> => {
    const { benchmarkData } = await getMockData();
    return benchmarkData;
};