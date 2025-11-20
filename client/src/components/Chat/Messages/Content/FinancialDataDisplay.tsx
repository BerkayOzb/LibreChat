/**
 * FinancialDataDisplay Component
 *
 * Displays financial data from Borsa-MCP tools in a rich, user-friendly format
 * Handles stock data, crypto prices, forex rates, fund performance, etc.
 *
 * Features:
 * - Color-coded price changes (green for positive, red for negative)
 * - Formatted numbers with Turkish locale
 * - Responsive grid layout
 * - Support for various financial data types
 */

import React, { useMemo } from 'react';
import type { TMessage } from 'librechat-data-provider';

interface StockData {
  symbol?: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  close?: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
}

interface CryptoData {
  symbol?: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume24h?: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
}

interface ForexData {
  pair?: string;
  buy?: number;
  sell?: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
}

interface FundData {
  name?: string;
  code?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  return1m?: number;
  return3m?: number;
  return6m?: number;
  return1y?: number;
}

type FinancialData = StockData | CryptoData | ForexData | FundData;

interface FinancialDataDisplayProps {
  data: FinancialData | FinancialData[];
  toolName?: string;
  content?: TMessage['content'];
}

/**
 * Format number with Turkish locale and specified decimal places
 */
const formatNumber = (value: number | undefined, decimals: number = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format large numbers (volume, market cap) with K/M/B suffixes
 */
const formatLargeNumber = (value: number | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return formatNumber(value, 0);
};

/**
 * Get color class based on value (positive = green, negative = red)
 */
const getChangeColor = (value: number | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'text-text-secondary';
  }
  return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
};

/**
 * Render stock data card
 */
const StockCard: React.FC<{ data: StockData }> = ({ data }) => {
  const changeColor = getChangeColor(data.change);
  const isPositive = (data.change ?? 0) >= 0;

  return (
    <div className="my-2 rounded-lg border border-border-medium bg-surface-primary p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{data.symbol}</h3>
          {data.name && <p className="text-sm text-text-secondary">{data.name}</p>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-text-primary">
            {formatNumber(data.price)} ₺
          </div>
          <div className={`text-sm font-semibold ${changeColor}`}>
            {isPositive ? '+' : ''}{formatNumber(data.change)} ({isPositive ? '+' : ''}
            {formatNumber(data.changePercent)}%)
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 border-t border-border-light pt-3 md:grid-cols-4">
        {data.volume !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">Hacim</p>
            <p className="font-semibold text-text-primary">{formatLargeNumber(data.volume)}</p>
          </div>
        )}
        {data.high !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">Yüksek</p>
            <p className="font-semibold text-text-primary">{formatNumber(data.high)} ₺</p>
          </div>
        )}
        {data.low !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">Düşük</p>
            <p className="font-semibold text-text-primary">{formatNumber(data.low)} ₺</p>
          </div>
        )}
        {data.marketCap !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">Piyasa Değeri</p>
            <p className="font-semibold text-text-primary">{formatLargeNumber(data.marketCap)}</p>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      {(data.pe !== undefined || data.eps !== undefined) && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border-light pt-3">
          {data.pe !== undefined && (
            <div>
              <p className="text-xs text-text-secondary">F/K Oranı</p>
              <p className="font-semibold text-text-primary">{formatNumber(data.pe)}</p>
            </div>
          )}
          {data.eps !== undefined && (
            <div>
              <p className="text-xs text-text-secondary">Hisse Başı Kazanç</p>
              <p className="font-semibold text-text-primary">{formatNumber(data.eps)} ₺</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Render crypto data card
 */
const CryptoCard: React.FC<{ data: CryptoData }> = ({ data }) => {
  const changeColor = getChangeColor(data.change);
  const isPositive = (data.change ?? 0) >= 0;

  return (
    <div className="my-2 rounded-lg border border-border-medium bg-surface-primary p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {data.symbol || data.name}
          </h3>
          {data.name && data.symbol && (
            <p className="text-sm text-text-secondary">{data.name}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-text-primary">
            ${formatNumber(data.price)}
          </div>
          <div className={`text-sm font-semibold ${changeColor}`}>
            {isPositive ? '+' : ''}{formatNumber(data.changePercent)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border-light pt-3 md:grid-cols-3">
        {data.volume24h !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">24s Hacim</p>
            <p className="font-semibold text-text-primary">${formatLargeNumber(data.volume24h)}</p>
          </div>
        )}
        {data.high24h !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">24s Yüksek</p>
            <p className="font-semibold text-text-primary">${formatNumber(data.high24h)}</p>
          </div>
        )}
        {data.low24h !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">24s Düşük</p>
            <p className="font-semibold text-text-primary">${formatNumber(data.low24h)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Render forex data card
 */
const ForexCard: React.FC<{ data: ForexData }> = ({ data }) => {
  const changeColor = getChangeColor(data.change);
  const isPositive = (data.change ?? 0) >= 0;

  return (
    <div className="my-2 rounded-lg border border-border-medium bg-surface-primary p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">{data.pair}</h3>
        <div className={`text-sm font-semibold ${changeColor}`}>
          {isPositive ? '+' : ''}{formatNumber(data.changePercent)}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.buy !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">Alış</p>
            <p className="text-xl font-bold text-text-primary">{formatNumber(data.buy, 4)} ₺</p>
          </div>
        )}
        {data.sell !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">Satış</p>
            <p className="text-xl font-bold text-text-primary">{formatNumber(data.sell, 4)} ₺</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Render fund data card
 */
const FundCard: React.FC<{ data: FundData }> = ({ data }) => {
  const changeColor = getChangeColor(data.change);
  const isPositive = (data.change ?? 0) >= 0;

  return (
    <div className="my-2 rounded-lg border border-border-medium bg-surface-primary p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-text-primary">{data.name || data.code}</h3>
        {data.code && data.name && (
          <p className="text-sm text-text-secondary">{data.code}</p>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between border-b border-border-light pb-3">
        <div className="text-xl font-bold text-text-primary">
          {formatNumber(data.price, 6)} ₺
        </div>
        <div className={`text-sm font-semibold ${changeColor}`}>
          {isPositive ? '+' : ''}{formatNumber(data.changePercent)}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.return1m !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">1 Aylık</p>
            <p className={`font-semibold ${getChangeColor(data.return1m)}`}>
              {formatNumber(data.return1m)}%
            </p>
          </div>
        )}
        {data.return3m !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">3 Aylık</p>
            <p className={`font-semibold ${getChangeColor(data.return3m)}`}>
              {formatNumber(data.return3m)}%
            </p>
          </div>
        )}
        {data.return6m !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">6 Aylık</p>
            <p className={`font-semibold ${getChangeColor(data.return6m)}`}>
              {formatNumber(data.return6m)}%
            </p>
          </div>
        )}
        {data.return1y !== undefined && (
          <div>
            <p className="text-xs text-text-secondary">1 Yıllık</p>
            <p className={`font-semibold ${getChangeColor(data.return1y)}`}>
              {formatNumber(data.return1y)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Detect financial data type and render appropriate card
 */
const FinancialCard: React.FC<{ data: FinancialData }> = ({ data }) => {
  // Type detection based on available fields
  if ('pair' in data && data.pair) {
    return <ForexCard data={data as ForexData} />;
  }
  if ('volume24h' in data || 'high24h' in data) {
    return <CryptoCard data={data as CryptoData} />;
  }
  if ('return1m' in data || 'return1y' in data) {
    return <FundCard data={data as FundData} />;
  }
  // Default to stock card
  return <StockCard data={data as StockData} />;
};

/**
 * Main component
 */
export const FinancialDataDisplay: React.FC<FinancialDataDisplayProps> = ({
  data,
  toolName,
  content,
}) => {
  const financialData = useMemo(() => {
    // If content is provided and is a string, try to parse it
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch {
        return data;
      }
    }
    return data;
  }, [content, data]);

  // Handle array of data
  if (Array.isArray(financialData)) {
    return (
      <div className="space-y-2">
        {financialData.map((item, index) => (
          <FinancialCard key={index} data={item} />
        ))}
      </div>
    );
  }

  // Handle single data object
  return <FinancialCard data={financialData} />;
};

export default FinancialDataDisplay;
