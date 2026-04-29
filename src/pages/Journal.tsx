import { useState } from "react";
import { useTrades } from "../hooks/useTrades";
import { Trade } from "../types";
import { calculateZerodhaCharges, calculatePnL } from "../lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { Calendar, Tag, MessageSquare, IndianRupee, TrendingUp, TrendingDown, ArrowRight, BookOpen, Award } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Meteors } from "../components/magicui/meteors";
import { BorderBeam } from "../components/magicui/border-beam";

export default function JournalPage() {
  const { trades } = useTrades();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const closedTrades = trades.filter(t => t.status === "CLOSED");

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-120px)]">
      {/* Trade Selector List */}
      <div className="lg:col-span-4 flex flex-col gap-5 overflow-y-auto pr-3 custom-scrollbar">
        <div className="sticky top-0 bg-bg-app/80 backdrop-blur-md py-4 z-20 flex items-center justify-between border-b border-stroke/50 mb-4">
          <h2 className="text-2xl font-black text-black-main flex items-center gap-3 uppercase tracking-tighter">
            <Calendar className="w-6 h-6 text-black-main" />
            Vantage Journal
          </h2>
          <Badge className="bg-accent text-secondary font-black text-[10px] uppercase tracking-widest px-3">{closedTrades.length} Entries</Badge>
        </div>
        
        {closedTrades.length === 0 ? (
          <div className="text-center py-20 text-gray-main bg-white rounded-lg border border-stroke font-black uppercase text-[10px] tracking-[0.3em]">
            Memory Bank Empty
          </div>
        ) : (
          <div className="space-y-4">
            {closedTrades.map((trade) => {
              const charges = calculateZerodhaCharges({
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                quantity: trade.quantity,
                exchange: trade.exchange,
                status: trade.status
              });
              const { netPnL } = calculatePnL({
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                quantity: trade.quantity,
                direction: trade.direction,
                charges: charges.total
              });

              return (
                <button 
                  key={trade.id} 
                  onClick={() => setSelectedTrade(trade)}
                  className={`w-full text-left p-6 rounded-lg border transition-all duration-300 group relative overflow-hidden ${
                    selectedTrade?.id === trade.id 
                      ? 'bg-white border-black-main shadow-2xl shadow-black/5 scale-[1.02]' 
                      : 'bg-accent/30 border-stroke hover:border-secondary hover:bg-white shadow-sm'
                  }`}
                >
                  {selectedTrade?.id === trade.id && <BorderBeam size={120} duration={6} colorFrom="#111111" colorTo="#959687" />}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <span className="text-2xl font-black text-black-main uppercase tracking-tighter block leading-none">{trade.ticker}</span>
                      <span className="text-[10px] text-gray-main font-black uppercase tracking-[0.2em] mt-1 block">{trade.exchange}</span>
                    </div>
                    <span className={`text-xl font-black font-mono tracking-tighter ${netPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {netPnL >= 0 ? '+' : '−'}₹{Math.abs(netPnL).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2 text-gray-main bg-accent/50 px-3 py-1.5 rounded-lg border border-stroke/50">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {format(parseISO(trade.exitDate!), "dd.MM.yy")}
                      </span>
                    </div>
                    <div className={cn(
                      "px-4 py-1.5 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase border",
                      trade.direction === 'LONG' 
                        ? 'bg-success-bg border-success/20 text-success' 
                        : 'bg-destructive-bg border-destructive/20 text-destructive'
                    )}>
                      {trade.direction}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Trade Detail View */}
      <div className="lg:col-span-8 overflow-y-auto pr-3 custom-scrollbar relative bg-white border border-stroke rounded-lg shadow-2xl shadow-black/5">
        <Meteors number={15} className="opacity-5" />
        <div className="relative z-10 w-full p-12">
          {selectedTrade ? (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stroke/30 pb-12 gap-8">
              <div>
                <div className="flex items-center gap-5 mb-3">
                  <h1 className="text-6xl font-black text-black-main tracking-tighter uppercase leading-none">{selectedTrade.ticker}</h1>
                  <div className="px-4 py-2 bg-accent rounded-lg border border-stroke text-secondary font-mono tracking-[0.3em] text-[10px] font-black">{selectedTrade.exchange}</div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="text-[11px] font-black text-gray-main uppercase tracking-[0.3em] flex items-center gap-2 bg-accent/30 px-4 py-2 rounded-lg border border-stroke/50">
                    Audit ID: <span className="font-mono text-black-main/70">{selectedTrade.id?.slice(0, 8)}...</span>
                  </p>
                  <p className="text-[11px] font-black text-gray-main uppercase tracking-[0.3em] flex items-center gap-2 bg-accent/30 px-4 py-2 rounded-lg border border-stroke/50">
                    Units: <span className="font-mono text-black-main/70">{selectedTrade.quantity}</span>
                  </p>
                </div>
              </div>
              
              <div className="bg-bg-app p-8 rounded-lg border border-stroke shadow-sm min-w-[280px] relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/30 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-accent/60 transition-colors" />
                <p className="text-[10px] text-gray-main uppercase tracking-[0.4em] font-black mb-4 relative z-10">Net Performance</p>
                <div className="flex items-center justify-between relative z-10">
                  {(() => {
                     const charges = calculateZerodhaCharges({
                        entryPrice: selectedTrade.entryPrice,
                        exitPrice: selectedTrade.exitPrice,
                        quantity: selectedTrade.quantity,
                        exchange: selectedTrade.exchange,
                        status: selectedTrade.status
                      });
                      const { netPnL } = calculatePnL({
                        entryPrice: selectedTrade.entryPrice,
                        exitPrice: selectedTrade.exitPrice,
                        quantity: selectedTrade.quantity,
                        direction: selectedTrade.direction,
                        charges: charges.total
                      });
                      return (
                        <>
                          <span className={`text-4xl font-black font-mono tracking-tighter ${netPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {netPnL >= 0 ? '+' : '−'}₹{Math.abs(netPnL).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                          </span>
                          <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all shadow-sm ${netPnL >= 0 ? 'bg-success-bg text-success shadow-success/10' : 'bg-destructive-bg text-destructive shadow-destructive/10'}`}>
                            {netPnL >= 0 ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
                          </div>
                        </>
                      );
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-bg-app border border-stroke rounded-lg overflow-hidden group hover:border-secondary transition-all">
                <div className="bg-white border-b border-stroke p-6">
                  <h3 className="text-[11px] uppercase tracking-[0.4em] font-black text-gray-main">Execution Matrix</h3>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center group/row">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-main leading-none">Entry Vector</span>
                    <div className="text-right">
                      <p className="font-black text-black-main font-mono text-lg tracking-tighter">₹{selectedTrade.entryPrice.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-main font-black uppercase tracking-widest mt-1 opacity-60 font-mono">{format(parseISO(selectedTrade.entryDate), "dd MMM · HH:mm")}</p>
                    </div>
                  </div>
                  <div className="h-px bg-stroke/30 w-full" />
                  <div className="flex justify-between items-center group/row">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-main leading-none">Exit Point</span>
                    <div className="text-right">
                      <p className="font-black text-black-main font-mono text-lg tracking-tighter">₹{selectedTrade.exitPrice?.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-main font-black uppercase tracking-widest mt-1 opacity-60 font-mono">{format(parseISO(selectedTrade.exitDate!), "dd MMM · HH:mm")}</p>
                    </div>
                  </div>
                  <div className="h-px bg-stroke/30 w-full" />
                  <div className="flex justify-between items-center group/row">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-main leading-none">Volume</span>
                    <span className="font-black text-black-main font-mono text-lg tracking-tighter uppercase">{selectedTrade.quantity} Shares</span>
                  </div>
                </div>
              </div>

              <div className="bg-bg-app border border-stroke rounded-lg overflow-hidden group hover:border-secondary transition-all">
                <div className="bg-white border-b border-stroke p-6">
                   <h3 className="text-[11px] uppercase tracking-[0.4em] font-black text-gray-main">Duty & Levies</h3>
                </div>
                <div className="p-8 space-y-4">
                   {(() => {
                      const c = calculateZerodhaCharges({
                        entryPrice: selectedTrade.entryPrice,
                        exitPrice: selectedTrade.exitPrice,
                        quantity: selectedTrade.quantity,
                        exchange: selectedTrade.exchange,
                        status: selectedTrade.status
                      });
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">STT/CTT Hub</span>
                            <span className="text-black-main font-black font-mono">₹{c.stt.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">Terminal Fee</span>
                            <span className="text-black-main font-black font-mono">₹{c.txnCharges.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">SEBI Protocol</span>
                            <span className="text-black-main font-black font-mono">₹{c.sebiCharges.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">GST Component</span>
                            <span className="text-black-main font-black font-mono">₹{c.gst.toFixed(2)}</span>
                          </div>
                          <div className="h-px bg-stroke/30 w-full" />
                          <div className="flex justify-between pt-4">
                            <span className="text-[11px] uppercase font-black tracking-[0.4em] text-black-main leading-none">Aggregate Cost</span>
                            <span className="text-black-main font-black font-mono text-lg tracking-tighter">₹{c.total.toFixed(2)}</span>
                          </div>
                        </>
                      );
                   })()}
                </div>
              </div>
            </div>

            <div className="bg-bg-app border border-stroke rounded-lg overflow-hidden group hover:border-secondary transition-all">
              <div className="bg-white border-b border-stroke p-8 flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-[0.4em] font-black text-gray-main flex items-center gap-3">
                  <MessageSquare className="w-5 h-5" />
                  Tactical Debrief
                </h3>
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center opacity-40">
                   <BookOpen className="w-5 h-5 text-black-main" />
                </div>
              </div>
              <div className="p-10">
                <p className="text-lg text-black-main/80 leading-relaxed whitespace-pre-wrap font-medium font-serif italic border-l-4 border-stroke pl-8 py-2">
                  {selectedTrade.notes || "System Note: No intelligence logs recorded for this tactical operation. Ensure future debriefings include psychological state and setup variance."}
                </p>
                
                <div className="mt-12 flex flex-wrap gap-4">
                   <div className="flex items-center gap-3 px-6 py-2.5 bg-white border border-stroke rounded-[1.5rem] text-[10px] font-black text-black-main uppercase tracking-[0.3em] shadow-sm">
                      <Tag className="w-3.5 h-3.5 text-secondary" />
                      Node: {selectedTrade.exchange}
                   </div>
                   <div className="flex items-center gap-3 px-6 py-2.5 bg-white border border-stroke rounded-[1.5rem] text-[10px] font-black text-black-main uppercase tracking-[0.3em] shadow-sm">
                      <Award className="w-3.5 h-3.5 text-secondary" />
                      Vector: {selectedTrade.direction}
                   </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-gray-main bg-accent/20 p-8 rounded-lg border border-stroke/30 uppercase tracking-[0.3em] gap-4">
               <span className="opacity-60">Verified Entry · {format(parseISO(selectedTrade.createdAt), "PPP")}</span>
               <div className="flex items-center gap-3">
                 Relay Status: <span className="text-black-main px-3 py-1 bg-white border border-stroke rounded-lg">Operational (V2)</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-main space-y-10 py-32">
            <div className="w-32 h-32 bg-accent/40 rounded-lg flex items-center justify-center border-2 border-dashed border-stroke animate-pulse">
              <BookOpen className="w-14 h-14 text-secondary/40" />
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-black text-black-main tracking-[0.4em] uppercase">Archive Terminal</h3>
              <p className="text-sm font-medium max-w-sm text-gray-main leading-relaxed px-8">Decrypt a log entry from the vantage journal to view tactical debriefings and performance analysis.</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
