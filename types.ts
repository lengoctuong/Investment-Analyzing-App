

export interface RawDataItem {
  navDate: string;
  navPrice?: number;
  diffPercentage?: number;
  navCurrency?: string;
}

export interface DCResponse {
  returnValue: {
    fundData: RawDataItem[];
    fundBenchmarkData: RawDataItem[];
  };
}

export interface FmarketResponse {
  data: {
    navDate: string;
    nav: number;
  }[];
}

export type DataSource = 'vnstock_stock' | 'vnstock_fund' | 'yfinance';

export type AssetItem = {
    source: DataSource;
    ticker: string;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface Asset {
  name: string;
  data: TimeSeriesData[];
}

export interface PerformanceMetrics {
  'Total Return': number;
  'Sharpe Ratio': number;
  'Max Drawdown': number;
  'Beta': number | null;
}

export interface ProcessedMetrics {
  year: string;
  asset: string;
  'Total Return': number;
  'Sharpe Ratio': number;
  'Max Drawdown': number;
  'Beta': number | null;
}