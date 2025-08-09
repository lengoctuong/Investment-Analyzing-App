import { DCResponse, RawDataItem, TimeSeriesData, FmarketResponse } from '../types';

const parseDataItems = (items: RawDataItem[]): TimeSeriesData[] => {
  return items
    .filter(item => item.navPrice != null && !isNaN(item.navPrice))
    .map(item => ({
      timestamp: new Date(item.navDate),
      value: item.navPrice as number,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

export const parseDCData = (jsonData: DCResponse): { fundData: TimeSeriesData[], benchmarkData: TimeSeriesData[] } => {
  const fundData = parseDataItems(jsonData.returnValue.fundData);
  const benchmarkData = parseDataItems(jsonData.returnValue.fundBenchmarkData);
  return { fundData, benchmarkData };
};

export const parseFmarketData = (jsonData: FmarketResponse): TimeSeriesData[] => {
  return jsonData.data
    .filter(item => item.nav != null && !isNaN(item.nav))
    .map(item => ({
      timestamp: new Date(item.navDate),
      value: item.nav,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};
