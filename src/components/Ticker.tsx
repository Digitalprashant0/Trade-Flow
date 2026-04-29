import Marquee from "./magicui/marquee";
import { usePrices } from "../hooks/usePrices";

const SYMBOLS = ["^NSEI", "^BSESN", "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBIN.NS"];

export default function Ticker() {
  const { prices, loading } = usePrices(SYMBOLS);

  if (loading && prices.length === 0) {
    return (
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden border-b border-stroke bg-white/50 backdrop-blur-md z-20 h-9">
        <div className="animate-pulse flex space-x-4 px-4 w-full justify-around">
          <div className="h-2 bg-accent/50 rounded w-20"></div>
          <div className="h-2 bg-accent/50 rounded w-20"></div>
          <div className="h-2 bg-accent/50 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden border-b border-stroke bg-white/50 backdrop-blur-md z-20">
      <Marquee pauseOnHover className="[--duration:60s]">
        {prices.map((ticker) => (
          <div key={ticker.symbol} className="flex items-center gap-2 px-6 py-2 border-r border-stroke">
            <span className="text-[10px] font-black text-black-main uppercase tracking-widest">{ticker.displayName.split(" ")[0]}</span>
            <span className="text-[10px] font-mono font-bold text-gray-main">
              ₹{ticker.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] font-black ${ticker.change >= 0 ? 'text-success' : 'text-destructive'}`}>
              {ticker.change >= 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
