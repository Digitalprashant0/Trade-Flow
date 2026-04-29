import { useState, useEffect } from "react";

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  displayName: string;
}

export function usePrices(symbols: string[]) {
  const [prices, setPrices] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const symbolsStr = symbols.join(",");
      const response = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbolsStr)}`);
      if (!response.ok) throw new Error("Failed to fetch prices");
      const data = await response.json();
      setPrices(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Poll every 10 seconds
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [symbols.join(",")]);

  return { prices, loading, error, refresh: fetchPrices };
}
