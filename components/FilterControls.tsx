import React from 'react';
import Card from './Card';

interface FilterControlsProps {
  startDate: string;
  endDate: string;
  groupBy: 'year' | 'month';
  minDate: string;
  maxDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setGroupBy: (group: 'year' | 'month') => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  startDate,
  endDate,
  groupBy,
  minDate,
  maxDate,
  setStartDate,
  setEndDate,
  setGroupBy,
}) => {
  return (
    <Card className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-text-secondary mb-1">
                Start Date
                </label>
                <input
                type="date"
                id="start-date"
                value={startDate}
                min={minDate}
                max={endDate || maxDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background-light border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2"
                />
            </div>
            <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-text-secondary mb-1">
                End Date
                </label>
                <input
                type="date"
                id="end-date"
                value={endDate}
                min={startDate || minDate}
                max={maxDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-background-light border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2"
                />
            </div>
            <div>
                <label htmlFor="group-by" className="block text-sm font-medium text-text-secondary mb-1">
                Group By
                </label>
                <select
                    id="group-by"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as 'year' | 'month')}
                    className="w-full bg-background-light border-gray-600 rounded-md shadow-sm focus:border-brand-primary focus:ring-brand-primary text-text-primary p-2 appearance-none bg-no-repeat bg-right pr-8"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em',
                    }}
                >
                    <option value="year">Yearly</option>
                    <option value="month">Monthly</option>
                </select>
            </div>
        </div>
    </Card>
  );
};

export default FilterControls;
