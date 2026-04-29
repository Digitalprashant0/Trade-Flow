import { useState, useEffect } from "react";
import { StockQuote } from "../hooks/usePrices";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceBadgeProps {
  symbol: string;
  className?: string;
}

export function PriceBadge({ symbol, className }: PriceBadgeProps) {
  const [data, setData] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPrice = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/price/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error();
      const result = await response.json();
      setData(result);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
  }, [symbol]);

  if (loading && !data) {
    return (
      <div className={cn("animate-pulse bg-slate-100 h-6 w-24 rounded-lg", className)} />
    );
  }

  if (error || !data) {
    return (
      <button 
        onClick={fetchPrice}
        className={cn("text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 hover:text-slate-600 transition-colors", className)}
      >
        <RefreshCw className="w-3 h-3" />
        Retry Price
      </button>
    );
  }

  const isPositive = data.change >= 0;

  return (
    <div className={cn("flex items-center gap-2 px-2 py-1 bg-white border border-slate-100 rounded-lg shadow-sm", className)}>
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-0.5">Live Price</span>
        <span className="text-[10px] font-mono font-bold text-slate-900 leading-none">
          ₹{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className={cn(
        "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black",
        isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}>
        {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {data.changePercent.toFixed(2)}%
      </div>
    </div>
  );
}
