import { useStats } from "../hooks/useStats";
import { useTrades } from "../hooks/useTrades";
import { useFunds } from "../hooks/useFunds";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, TrendingDown, IndianRupee, Target, Award, BarChart3, Clock, Scale, Zap, Shield, Search, Activity, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { calculateZerodhaCharges, calculatePnL } from "../lib/calculations";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { BentoGrid, BentoCard } from "@/components/magicui/bento-grid";
import WordRotate from "@/components/magicui/word-rotate";
import { BorderBeam } from "@/components/magicui/border-beam";
import { usePrices } from "../hooks/usePrices";
import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";

function MetricCard({ title, value, subValue, icon: Icon, trend }: any) {
  return (
    <Card className="bg-white border-stroke shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40 relative overflow-hidden rounded-lg p-2">
      <BorderBeam size={100} duration={8} delay={Math.random() * 5} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em]">{title}</CardTitle>
        <Icon className="w-3.5 h-3.5 text-gray-main" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-black font-mono tracking-tighter ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-black-main'}`}>
          {value}
        </div>
        {subValue && <p className="text-[10px] font-bold text-gray-main mt-1 uppercase tracking-widest">{subValue}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { trades } = useTrades();
  const { transactions } = useFunds();
  const stats = useStats(trades, transactions);

  // Extract tickers for live prices
  const openTickers = useMemo(() => {
    return stats.openTrades.map(t => t.ticker);
  }, [stats.openTrades]);

  const { prices: livePrices } = usePrices(openTickers);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-black text-black-main tracking-tighter uppercase">Trading</h1>
             <WordRotate 
                words={["Insight", "Alpha", "Edge", "Logic"]} 
                className="text-3xl font-black text-info tracking-tighter uppercase"
             />
          </div>
          <p className="text-gray-main font-medium mt-1">High-fidelity execution metrics and performance overview.</p>
        </div>
        <div className="px-5 py-2.5 bg-accent/30 rounded-lg border border-stroke shadow-sm flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success/40 animate-ping" />
          </div>
          <span className="text-[10px] font-black text-black-main uppercase tracking-[0.2em]">Engine Live</span>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Net P&L" 
          value={formatCurrency(stats.netPnL)} 
          subValue={`Gross: ${formatCurrency(stats.grossPnL)}`}
          icon={IndianRupee}
          trend={stats.netPnL >= 0 ? 'up' : 'down'}
        />
        <MetricCard 
          title="Win Rate" 
          value={`${stats.winRate.toFixed(1)}%`} 
          subValue={`${stats.totalTrades} Total Trades`}
          icon={Award}
          trend={stats.winRate >= 50 ? 'up' : 'down'}
        />
        <MetricCard 
          title="Profit Factor" 
          value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} 
          subValue="W/L Contribution"
          icon={Scale}
        />
        <MetricCard 
          title="Total Charges" 
          value={formatCurrency(stats.totalCharges)} 
          subValue="Brokerage & Taxes"
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Average Win" 
          value={formatCurrency(stats.averageWin)} 
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard 
          title="Average Loss" 
          value={formatCurrency(stats.averageLoss)} 
          icon={TrendingDown}
          trend="down"
        />
        <MetricCard 
          title="Best Trade" 
          value={formatCurrency(stats.bestTrade)} 
          icon={Target}
          trend="up"
        />
        <MetricCard 
          title="Worst Trade" 
          value={formatCurrency(stats.worstTrade)} 
          icon={TrendingDown}
          trend="down"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white border-stroke p-8 rounded-lg shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-black-main tracking-tight uppercase">Equity Curve</h3>
              <p className="text-[10px] uppercase font-black text-gray-main tracking-[0.2em] mt-1">Cumulative Net Performance</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityCurve}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1A73E8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#8B949E" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                <YAxis stroke="#8B949E" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0F172A', fontWeight: '900', fontSize: '12px' }}
                />
                <Area type="stepAfter" dataKey="value" stroke="#1A73E8" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-white border-stroke p-8 rounded-lg shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-black-main tracking-tight uppercase">Liquidity Profile</h3>
              <p className="text-[10px] uppercase font-black text-gray-main tracking-[0.2em] mt-1">Balance & Yield progression</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success-bg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.balanceHistory}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16C784" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16C784" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" stroke="#8B949E" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} />
                <YAxis stroke="#8B949E" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0F172A', fontWeight: '900', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#16C784" strokeWidth={4} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Open Positions Overview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-black-main tracking-tighter uppercase flex items-center gap-3">
                Active Battleground
                <RefreshCw className="w-4 h-4 text-success animate-spin-slow" />
              </h2>
              <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] mt-1">Live exposure & unrealized yield</p>
            </div>
          </div>
          
          {stats.openTrades.length > 0 && (
            <div className="flex items-center gap-6 px-6 py-3 bg-white border border-stroke rounded-lg shadow-sm">
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-main uppercase tracking-[0.2em] leading-none mb-2">Portfolio P&L</p>
                {(() => {
                  let totalLivePnL = 0;
                  stats.openTrades.forEach(trade => {
                    const ticker = trade.ticker.toUpperCase();
                    const cleanTicker = ticker.includes(".") ? ticker : `${ticker}.NS`;
                    const liveData = livePrices.find(p => p.symbol.toUpperCase() === cleanTicker);
                    
                    if (liveData) {
                      const charges = calculateZerodhaCharges({
                        entryPrice: trade.entryPrice,
                        exitPrice: liveData.price,
                        quantity: trade.quantity,
                        exchange: trade.exchange,
                        status: trade.status
                      });
                      const { netPnL } = calculatePnL({
                        entryPrice: trade.entryPrice,
                        exitPrice: liveData.price,
                        quantity: trade.quantity,
                        direction: trade.direction,
                        charges: charges.total
                      });
                      totalLivePnL += netPnL;
                    }
                  });
                  return (
                    <p className={`text-lg font-black font-mono tracking-tighter transition-colors ${totalLivePnL >= 0 ? "text-success" : "text-destructive"}`}>
                      {totalLivePnL >= 0 ? "+" : ""}
                      {formatCurrency(totalLivePnL)}
                    </p>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {stats.openTrades.length === 0 ? (
          <div className="bg-white border border-dashed border-stroke rounded-lg p-24 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-6">
              <Target className="w-10 h-10 text-secondary" />
            </div>
            <h3 className="text-xl font-black text-black-main tracking-tight uppercase">Strategic Pause</h3>
            <p className="text-sm text-gray-main mt-3 max-w-sm font-medium">Scanning for low-risk, high-probability liquidity events. Execution engine is primed for entry.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence>
              {stats.openTrades.map((trade) => {
                const ticker = trade.ticker.toUpperCase();
                const cleanTicker = ticker.includes(".") ? ticker : `${ticker}.NS`;
                const liveData = livePrices.find(p => p.symbol.toUpperCase() === cleanTicker);
                
                const charges = calculateZerodhaCharges({
                  entryPrice: trade.entryPrice,
                  exitPrice: liveData?.price || trade.entryPrice,
                  quantity: trade.quantity,
                  exchange: trade.exchange,
                  status: trade.status
                });

                const { netPnL, roi } = calculatePnL({
                  entryPrice: trade.entryPrice,
                  exitPrice: liveData?.price,
                  quantity: trade.quantity,
                  direction: trade.direction,
                  charges: charges.total
                });

                return (
                  <motion.div 
                    key={trade.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg border border-stroke shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all p-8 group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-xs ${trade.direction === 'LONG' ? 'bg-success-bg text-success' : 'bg-destructive-bg text-destructive'}`}>
                          {trade.direction === 'LONG' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="font-black text-black-main uppercase tracking-tighter text-xl leading-none">{trade.ticker}</h4>
                          <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em] mt-1.5">{trade.exchange}</p>
                        </div>
                      </div>
                      
                      {liveData ? (
                        <div className="text-right">
                          <p className="text-lg font-black text-black-main font-mono tracking-tighter">₹{liveData.price.toLocaleString('en-IN')}</p>
                          <p className={`text-[11px] font-black ${liveData.change >= 0 ? "text-success" : "text-destructive"}`}>
                            {liveData.change >= 0 ? "+" : ""}{liveData.changePercent.toFixed(2)}%
                          </p>
                        </div>
                      ) : (
                        <div className="w-20 h-10 bg-accent/50 animate-pulse rounded-lg" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-5 mb-8">
                      <div className="p-4 bg-accent/20 rounded-lg border border-stroke/50">
                        <p className="text-[9px] font-black text-gray-main uppercase tracking-[0.2em] mb-2 leading-none">Net Cost</p>
                        <p className="text-sm font-black text-black-main font-mono tracking-tight">{formatCurrency(trade.entryPrice)}</p>
                      </div>
                      <div className="p-4 bg-accent/20 rounded-lg border border-stroke/50">
                        <p className="text-[9px] font-black text-gray-main uppercase tracking-[0.2em] mb-2 leading-none">Lot Size</p>
                        <p className="text-sm font-black text-black-main font-mono tracking-tight">{trade.quantity}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-stroke/30">
                      <div>
                        <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] mb-2 leading-none">Unrealized Edge</p>
                        <div className="flex items-baseline gap-3">
                           <p className={`text-2xl font-black font-mono tracking-tighter ${netPnL >= 0 ? "text-success" : "text-destructive"}`}>
                              {netPnL >= 0 ? "+" : ""}
                              {formatCurrency(netPnL)}
                            </p>
                            <span className={`text-xs font-black ${roi >= 0 ? "text-success/60" : "text-destructive/60"}`}>
                              {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                            </span>
                        </div>
                      </div>
                      <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center group-hover:bg-black-main transition-all duration-500">
                        <Zap className="w-6 h-6 text-secondary group-hover:text-white transition-colors" />
                      </div>
                    </div>

                    {/* Progress Bar for Risk */}
                    {trade.stopLoss && (
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-main">
                          <span>Risk Profile</span>
                          <span className="text-destructive">Max: {formatCurrency(Math.abs((trade.entryPrice - trade.stopLoss) * trade.quantity))}</span>
                        </div>
                        <div className="h-2 bg-accent/30 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "45%" }} 
                            className="h-full bg-destructive/60 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
}
