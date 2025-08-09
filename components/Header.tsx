import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-background-light shadow-md">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h1 className="text-2xl font-bold text-text-primary">
              Fund Performance Analyzer
            </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
