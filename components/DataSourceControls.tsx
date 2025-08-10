
import React from 'react';
import Card from './Card';
import { DataSource, AssetItem } from '../types';

interface DataSourceControlsProps {
  assetItems: AssetItem[];
  setAssetItems: (items: AssetItem[]) => void;
  benchmarkTicker: string;
  setBenchmarkTicker: (ticker: string) => void;
  apiStartDate: string;
  setApiStartDate: (date: string) => void;
  apiEndDate: string;
  setApiEndDate: (date: string) => void;
  onLoadData: () => void;
}


const DataSourceControls: React.FC<DataSourceControlsProps> = ({ 
    assetItems, setAssetItems, 
    benchmarkTicker, setBenchmarkTicker,
    apiStartDate, setApiStartDate,
    apiEndDate, setApiEndDate,
    onLoadData 
}) => {

    const handleAssetChange = (index: number, field: 'source' | 'ticker', value: string) => {
        const newAssets = [...assetItems];
        const asset = { ...newAssets[index], [field]: value };
        if (field === 'ticker') {
            asset.ticker = value.toUpperCase();
        } else {
            // Reset ticker on source change to avoid invalid combinations
            asset.ticker = '';
        }
        newAssets[index] = asset;
        setAssetItems(newAssets);
    };

    const addAsset = () => {
        setAssetItems([...assetItems, { source: 'vnstock_stock', ticker: '' }]);
    };

    const removeAsset = (index: number) => {
        setAssetItems(assetItems.filter((_, i) => i !== index));
    };

    const renderAssetInputs = (asset: AssetItem, index: number) => (
         <div key={index} className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-center mb-4 p-4 bg-background-light rounded-md">
            <div className="sm:col-span-2">
                <label htmlFor={`data-source-${index}`} className="block text-sm font-medium text-text-secondary mb-1">
                    Source
                </label>
                <select
                    id={`data-source-${index}`}
                    value={asset.source}
                    onChange={(e) => handleAssetChange(index, 'source', e.target.value)}
                    className="w-full bg-card-dark border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2 appearance-none bg-no-repeat bg-right pr-8"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
                >
                    <option value="vnstock_stock">VNStock API (Stock)</option>
                    <option value="vnstock_fund">VNStock API (Fund)</option>
                    <option value="yfinance">Yahoo Finance API</option>
                </select>
            </div>
            <div className="sm:col-span-3">
                <label htmlFor={`ticker-${index}`} className="block text-sm font-medium text-text-secondary mb-1">
                    Ticker
                </label>
                <input
                    type="text"
                    id={`ticker-${index}`}
                    value={asset.ticker}
                    onChange={(e) => handleAssetChange(index, 'ticker', e.target.value)}
                    placeholder={asset.source === 'yfinance' ? 'e.g., AAPL' : 'e.g., FPT'}
                    className="w-full bg-card-dark border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2"
                />
            </div>
            <div className="sm:col-span-1 flex items-end h-full">
                <button
                    onClick={() => removeAsset(index)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-md transition duration-300 mt-2"
                    aria-label={`Remove asset ${index + 1}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <Card>
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-text-primary">Load Performance Data</h2>
                    
                    {/* Global Settings */}
                    <div className="p-4 bg-background-light rounded-md space-y-4">
                        <h3 className="text-lg font-semibold text-text-primary">Global Settings</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="api-start-date" className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
                                <input type="date" id="api-start-date" value={apiStartDate} max={apiEndDate} onChange={(e) => setApiStartDate(e.target.value)} className="w-full bg-card-dark border-gray-600 rounded-md shadow-sm p-2 text-text-primary"/>
                            </div>
                            <div>
                                <label htmlFor="api-end-date" className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
                                <input type="date" id="api-end-date" value={apiEndDate} min={apiStartDate} onChange={(e) => setApiEndDate(e.target.value)} className="w-full bg-card-dark border-gray-600 rounded-md shadow-sm p-2 text-text-primary"/>
                            </div>
                            <div>
                               <label htmlFor="benchmark-ticker" className="block text-sm font-medium text-text-secondary mb-1">Benchmark (VNStock)</label>
                               <input type="text" id="benchmark-ticker" value={benchmarkTicker} onChange={(e) => setBenchmarkTicker(e.target.value.toUpperCase())} placeholder="e.g., VNINDEX" className="w-full bg-card-dark border-gray-600 rounded-md shadow-sm p-2 text-text-primary"/>
                            </div>
                        </div>
                    </div>

                    {/* Asset List */}
                    <div>
                         <h3 className="text-lg font-semibold text-text-primary mb-2">Assets to Compare</h3>
                        {assetItems.map(renderAssetInputs)}
                        <button onClick={addAsset} className="w-full border-2 border-dashed border-gray-600 hover:border-brand-primary hover:text-brand-primary text-text-secondary font-bold py-2 px-4 rounded-md transition duration-300">
                            + Add Asset
                        </button>
                    </div>
                    
                    <div className="pt-4">
                        <button
                            onClick={onLoadData}
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