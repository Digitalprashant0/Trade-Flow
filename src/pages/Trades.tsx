import * as React from "react";
import { useState } from "react";
import { useTrades } from "../hooks/useTrades";
import { Trade, Direction, Exchange, TradeStatus } from "../types";
import { calculateZerodhaCharges, calculatePnL } from "../lib/calculations";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { Plus, Trash2, Edit2, Search, Filter, Download, X, Calendar, TrendingUp, BarChart2, IndianRupee, Hash, Activity, Info, Clock, ArrowUpRight, ArrowDownRight, Percent, ShieldCheck, RefreshCw } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Meteors } from "../components/magicui/meteors";
import { PriceBadge } from "../components/PriceBadge";

import { usePrices } from "../hooks/usePrices";

const InsetInput = ({ label, icon: Icon, children, className = "" }: { label: string; icon?: any; children: React.ReactNode; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    <label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">
      {label}
    </label>
    <div className="relative flex items-center">
      {Icon && <Icon className="absolute left-3.5 w-4 h-4 text-gray-main" />}
      {children}
    </div>
  </div>
);

const SegmentedControl = ({ 
  options, 
  value, 
  onChange, 
  activeColor = "bg-primary" 
}: { 
  options: { label: string; value: string }[], 
  value: string, 
  onChange: (val: any) => void,
  activeColor?: string
}) => (
  <div className="flex p-1 bg-accent/30 border border-stroke rounded-lg w-full">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`flex-1 py-2 text-[10px] font-black tracking-widest rounded-lg transition-all duration-300 ${
          value === opt.value 
            ? `${activeColor} text-white shadow-lg` 
            : "text-gray-main hover:text-black-main hover:bg-white/50"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function TradesPage() {
  const { trades, addTrade, updateTrade, removeTrade, loading } = useTrades();
  
  // Extract unique tickers for live pricing
  const uniqueTickers = React.useMemo(() => {
    return Array.from(new Set(trades.map(t => t.ticker)));
  }, [trades]);

  const { prices: livePrices } = usePrices(uniqueTickers);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    ticker: "",
    direction: "LONG" as Direction,
    exchange: "NSE" as Exchange,
    status: "OPEN" as TradeStatus,
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    entryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    exitDate: "",
    stopLoss: "",
    notes: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tradeData = {
      ...formData,
      entryPrice: parseFloat(formData.entryPrice),
      exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined,
      quantity: parseFloat(formData.quantity),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
    };

    if (editingTradeId) {
      await updateTrade(editingTradeId, tradeData);
      toast.success("Trade updated successfully");
    } else {
      await addTrade(tradeData);
      toast.success("Trade added successfully");
    }

    setIsModalOpen(false);
    setEditingTradeId(null);
    setFormData({
      ticker: "",
      direction: "LONG",
      exchange: "NSE",
      status: "OPEN",
      entryPrice: "",
      exitPrice: "",
      quantity: "",
      entryDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      exitDate: "",
      stopLoss: "",
      notes: ""
    });
  };

  const startEdit = (trade: Trade) => {
    setEditingTradeId(trade.id!);
    setFormData({
      ticker: trade.ticker,
      direction: trade.direction,
      exchange: trade.exchange,
      status: trade.status,
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice?.toString() || "",
      quantity: trade.quantity.toString(),
      entryDate: trade.entryDate.slice(0, 16),
      exitDate: trade.exitDate?.slice(0, 16) || "",
      stopLoss: trade.stopLoss?.toString() || "",
      notes: trade.notes || ""
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const filteredTrades = trades.filter(t => {
    const tickerMatch = t.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!selectedMonth) return tickerMatch;

    const tradeDate = parseISO(t.entryDate);
    const start = startOfMonth(parseISO(`${selectedMonth}-01`));
    const end = endOfMonth(start);

    const monthMatch = isWithinInterval(tradeDate, { start, end });
    return tickerMatch && monthMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-black-main tracking-tighter uppercase">Execution Journal</h1>
          <p className="text-gray-main font-medium mt-1">Immutable record of high-fidelity trades and performance metrics.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if(!open) setEditingTradeId(null); }}>
          <DialogTrigger 
            render={
              <button className="bg-black-main hover:bg-secondary text-white hover:text-black-main px-6 py-2.5 rounded-lg font-black text-xs tracking-widest uppercase transition-all duration-300 shadow-xl shadow-black/10 flex items-center gap-3">
                <Plus className="w-5 h-5" />
                Add Position
              </button>
            }
          />
          <DialogContent showCloseButton={false} className="bg-bg-app border-stroke text-black-main sm:max-w-[800px] p-0 overflow-hidden shadow-2xl rounded-lg">
            <Meteors number={15} className="opacity-20" />
            <div className="relative z-10 text-black-main">
              <div className="flex items-center justify-between p-10 pb-4">
                 <div>
                    <DialogTitle className="text-3xl font-black text-black-main tracking-tighter uppercase">
                      {editingTradeId ? "Update Trade" : "New Position"}
                    </DialogTitle>
                    <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em] mt-1.5">Execution Log Terminal</p>
                  </div>
                <DialogClose render={<button type="button" className="w-12 h-12 flex items-center justify-center rounded-lg bg-accent/50 hover:bg-accent transition-all text-secondary hover:text-black-main pointer-events-auto" aria-label="Close" />}>
                  <X className="w-6 h-6" />
                </DialogClose>
              </div>

              <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Instrument Details */}
              <div className="grid grid-cols-2 gap-6 bg-accent/20 p-6 rounded-lg border border-stroke/50">
                <InsetInput label="Symbol" icon={TrendingUp} className="col-span-2 sm:col-span-1">
                  <Input name="ticker" value={formData.ticker} onChange={handleInputChange} placeholder="e.g. RELIANCE" className="pl-10 h-14 bg-white border-stroke focus:border-black-main focus:ring-0 rounded-lg font-black text-black-main uppercase tracking-tight" required />
                </InsetInput>
                <div className="col-span-2 sm:col-span-1 space-y-2 py-1">
                  <label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Direction</label>
                  <SegmentedControl 
                    options={[{ label: "LONG", value: "LONG" }, { label: "SHORT", value: "SHORT" }]}
                    value={formData.direction}
                    onChange={(v) => handleSelectChange("direction", v)}
                    activeColor={formData.direction === "LONG" ? "bg-success" : "bg-destructive"}
                  />
                </div>
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-2 gap-6">
                <InsetInput label="Entry Price" icon={IndianRupee}>
                  <Input name="entryPrice" type="number" step="0.01" value={formData.entryPrice} onChange={handleInputChange} placeholder="0.00" className="pl-10 h-14 bg-white border-stroke focus:border-black-main focus:ring-0 rounded-lg font-mono font-black text-black-main" required />
                </InsetInput>
                <InsetInput label="Quantity" icon={Hash}>
                  <Input name="quantity" type="number" step="any" value={formData.quantity} onChange={handleInputChange} placeholder="100" className="pl-10 h-14 bg-white border-stroke focus:border-black-main focus:ring-0 rounded-lg font-mono font-black text-black-main" required />
                </InsetInput>
                <InsetInput label="Execution Date" icon={Calendar}>
                  <Input name="entryDate" type="datetime-local" value={formData.entryDate} onChange={handleInputChange} className="pl-10 h-14 bg-white border-stroke focus:border-black-main focus:ring-0 rounded-lg text-xs font-black text-black-main" required />
                </InsetInput>
                <InsetInput label="Stop Loss" icon={Activity}>
                  <Input name="stopLoss" type="number" step="0.01" value={formData.stopLoss} onChange={handleInputChange} placeholder="Optional" className="pl-10 h-14 bg-white border-stroke focus:border-destructive focus:ring-0 rounded-lg font-mono font-black text-destructive" />
                </InsetInput>
              </div>

              {/* Status Section */}
              <div className="p-6 bg-accent/20 border border-stroke/50 rounded-lg space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em]">Current State</span>
                  <div className="w-1/2">
                    <SegmentedControl 
                      options={[{ label: "OPEN", value: "OPEN" }, { label: "CLOSED", value: "CLOSED" }]}
                      value={formData.status}
                      onChange={(v) => handleSelectChange("status", v)}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {formData.status === "CLOSED" && (
                    <motion.div 
                      key="closed"
                      initial={{ opacity: 0, scale: 0.98, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: "auto" }}
                      exit={{ opacity: 0, scale: 0.98, height: 0 }}
                      className="grid grid-cols-2 gap-6 pb-2 pt-4 overflow-hidden border-t border-stroke/30"
                    >
                      <InsetInput label="Exit Price" icon={IndianRupee}>
                        <Input name="exitPrice" type="number" step="0.01" value={formData.exitPrice} onChange={handleInputChange} className="pl-10 h-14 bg-white border-stroke focus:border-success focus:ring-0 rounded-lg font-mono font-black text-success" required />
                      </InsetInput>
                      <InsetInput label="Closing Date" icon={Calendar}>
                        <Input name="exitDate" type="datetime-local" value={formData.exitDate} onChange={handleInputChange} className="pl-10 h-14 bg-white border-stroke focus:border-black-main focus:ring-0 rounded-lg text-xs font-black text-black-main" required />
                      </InsetInput>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Trade Thesis & Remarks</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  className="w-full h-32 bg-white border border-stroke rounded-lg p-6 text-sm font-medium focus:border-black-main outline-none transition-all resize-none text-black-main placeholder:text-gray-main/50"
                  placeholder="Analyze the edge, emotions, and setup quality..."
                />
              </div>

              {/* Summary */}
              {formData.entryPrice && formData.quantity && (
                <div className="flex justify-between items-center py-6 px-1 border-t border-stroke/30">
                   {(() => {
                    const charges = calculateZerodhaCharges({
                      entryPrice: parseFloat(formData.entryPrice) || 0,
                      exitPrice: parseFloat(formData.exitPrice) || parseFloat(formData.entryPrice) || 0,
                      quantity: parseFloat(formData.quantity) || 0,
                      exchange: formData.exchange,
                      status: formData.status
                    });
                    const netPnL = formData.exitPrice ? 
                      (((parseFloat(formData.exitPrice) - parseFloat(formData.entryPrice)) * (formData.direction === "LONG" ? 1 : -1) * parseFloat(formData.quantity)) - charges.total)
                      : 0;
                    return (
                      <>
                        <div className="flex gap-8 text-[11px]">
                          <div>
                            <p className="text-gray-main uppercase tracking-widest font-black mb-1">Exposure</p>
                            <p className="text-black-main font-mono font-black">₹{(parseFloat(formData.entryPrice) * parseFloat(formData.quantity)).toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-gray-main uppercase tracking-widest font-black mb-1">Fee Load</p>
                            <p className="text-gray-main font-mono">₹{charges.total.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-main uppercase tracking-widest font-black mb-1">Expectancy (Net)</p>
                          <p className={`text-3xl font-black font-mono tracking-tighter ${formData.exitPrice ? (netPnL >= 0 ? "text-success" : "text-destructive") : "text-gray-main/30"}`}>
                            {formData.exitPrice ? `${netPnL >= 0 ? "+" : ""}₹${Math.abs(netPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "₹0.00"}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <DialogClose render={<button type="button" className="flex-1 text-gray-main text-xs font-black tracking-widest uppercase hover:bg-accent/40 rounded-lg h-14 transition-all pointer-events-auto" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" className="flex-[2] bg-black-main hover:bg-secondary text-white hover:text-black-main font-black text-xs tracking-widest uppercase h-14 rounded-lg shadow-2xl shadow-black/20 active:scale-[0.98] transition-all">
                  {editingTradeId ? "Confirm Update" : "Log Trade"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>

        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-6 bg-white p-6 rounded-lg border border-stroke shadow-sm mt-8">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-main" />
          <Input 
            placeholder="Search by instrument name..." 
            className="pl-12 h-12 bg-accent/10 border-stroke text-black-main focus:bg-white rounded-lg transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-main" />
          <Input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-accent/10 border-stroke h-12 w-[220px] text-xs font-black text-black-main focus:bg-white rounded-lg transition-all uppercase tracking-widest"
          />
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setSelectedMonth(format(new Date(), "yyyy-MM"))}
          className="border-stroke h-12 bg-white text-black-main text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-accent/30 transition-all px-6"
        >
          Present Month
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-stroke overflow-hidden shadow-xl shadow-slate-200/40 mt-8">
        <Table>
          <TableHeader className="bg-accent/20">
            <TableRow className="border-stroke hover:bg-transparent h-16">
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em] pl-8">Instrument</TableHead>
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em]">Context</TableHead>
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em]">Status</TableHead>
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em] text-right">Units</TableHead>
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em] text-right">Entry</TableHead>
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em] text-right">Market</TableHead>
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em] text-right">Exit</TableHead>
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em] text-right">Net Yld</TableHead>
              <TableHead className="text-gray-main font-black text-[10px] uppercase tracking-[0.2em] text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-20 text-gray-main font-black uppercase text-[10px] tracking-[0.3em]">Synchronizing Records...</TableCell>
              </TableRow>
            ) : filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-20 text-gray-main font-black uppercase text-[10px] tracking-[0.3em]">No entries recorded in this quadrant.</TableCell>
              </TableRow>
            ) : (
              filteredTrades.map((trade) => {
                const ticker = trade.ticker.toUpperCase();
                const cleanTicker = ticker.includes(".") ? ticker : `${ticker}.NS`;
                const liveData = livePrices.find(p => p.symbol.toUpperCase() === cleanTicker);
                const currentPrice = trade.status === 'OPEN' ? liveData?.price : trade.exitPrice;

                const charges = calculateZerodhaCharges({
                  entryPrice: trade.entryPrice,
                  exitPrice: currentPrice || trade.entryPrice,
                  quantity: trade.quantity,
                  exchange: trade.exchange,
                  status: trade.status
                });
                const { netPnL } = calculatePnL({
                  entryPrice: trade.entryPrice,
                  exitPrice: currentPrice,
                  quantity: trade.quantity,
                  direction: trade.direction,
                  charges: charges.total
                });

                return (
                  <TableRow key={trade.id} className="border-stroke hover:bg-accent/10 transition-colors group h-20">
                    <TableCell className="font-black text-black-main pl-8">
                      <div className="flex flex-col">
                        <span className="tracking-tight uppercase">{trade.ticker}</span>
                        <span className="text-[10px] text-gray-main font-black tracking-widest">{trade.exchange}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`px-3 py-1 rounded-md font-black text-[10px] tracking-widest ${trade.direction === 'LONG' ? 'border-success/20 bg-success-bg text-success' : 'border-destructive/20 bg-destructive-bg text-destructive'}`}>
                        {trade.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`px-3 py-1 rounded-md font-black text-[10px] tracking-widest ${trade.status === 'OPEN' ? 'bg-info/10 text-info' : 'bg-accent text-secondary'}`}>
                        {trade.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-black text-gray-main">{trade.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-black-main font-medium">{formatCurrency(trade.entryPrice)}</TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const ticker = trade.ticker.toUpperCase();
                        const cleanTicker = ticker.includes(".") ? ticker : `${ticker}.NS`;
                        const liveData = livePrices.find(p => p.symbol.toUpperCase() === cleanTicker);
                        
                        if (!liveData) return <span className="text-gray-main font-mono text-xs">—</span>;
                        
                        return (
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-black text-black-main text-sm tracking-tighter">₹{liveData.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            <span className={`text-[9px] font-black ${liveData.change >= 0 ? "text-success" : "text-destructive"}`}>
                              {liveData.change >= 0 ? "+" : ""}{liveData.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-main/50 font-medium">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</TableCell>
                    <TableCell className={`text-right font-black font-mono tracking-tighter ${netPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {trade.status === 'OPEN' && currentPrice && (
                        <span className="text-[9px] block font-black uppercase text-gray-main tracking-widest leading-none mb-1">Live Yld</span>
                      )}
                      {formatCurrency(netPnL)}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button variant="ghost" size="icon" onClick={() => setViewingTrade(trade)} className="h-10 w-10 rounded-lg hover:bg-accent/50 text-secondary hover:text-black-main">
                          <Info className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => startEdit(trade)} className="h-10 w-10 rounded-lg hover:bg-accent/50 text-secondary hover:text-black-main">
                          <Edit2 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeTrade(trade.id!)} className="h-10 w-10 rounded-lg hover:bg-destructive-bg text-secondary hover:text-destructive">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewingTrade} onOpenChange={() => setViewingTrade(null)}>
        <DialogContent showCloseButton={false} className="bg-bg-app border-stroke text-black-main sm:max-w-[1020px] p-0 overflow-hidden shadow-2xl rounded-lg">
          <Meteors number={20} className="opacity-10" />
          <div className="relative z-10 w-full h-full">
            {viewingTrade && (() => {
              const ticker = viewingTrade.ticker.toUpperCase();
              const cleanTicker = ticker.includes(".") ? ticker : `${ticker}.NS`;
              const liveData = livePrices.find(p => p.symbol.toUpperCase() === cleanTicker);
              const currentPrice = viewingTrade.status === 'OPEN' ? liveData?.price : viewingTrade.exitPrice;

            const charges = calculateZerodhaCharges({
              entryPrice: viewingTrade.entryPrice,
              exitPrice: currentPrice || viewingTrade.entryPrice,
              quantity: viewingTrade.quantity,
              exchange: viewingTrade.exchange,
              status: viewingTrade.status
            });
            const { netPnL, roi } = calculatePnL({
              entryPrice: viewingTrade.entryPrice,
              exitPrice: currentPrice,
              quantity: viewingTrade.quantity,
              direction: viewingTrade.direction,
              charges: charges.total
            });

            return (
              <div className="flex flex-col">
                {/* Header Section */}
                <div className={`p-10 pb-16 relative overflow-hidden ${netPnL >= 0 ? "bg-success-bg" : "bg-destructive-bg"}`}>
                  <div className="absolute top-0 right-0 p-8">
                    <DialogClose render={<button type="button" className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/40 hover:bg-white/80 transition-all text-secondary hover:text-black-main shadow-sm pointer-events-auto" aria-label="Close" />}>
                      <X className="w-6 h-6" />
                    </DialogClose>
                  </div>

                  <div className="flex justify-between items-end relative z-10">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Badge className={`${viewingTrade.direction === "LONG" ? "bg-success" : "bg-destructive"} text-white font-black text-[10px] tracking-widest py-1.5 px-4 rounded-lg border-none shadow-lg shadow-black/5`}>
                          {viewingTrade.direction}
                        </Badge>
                        <Badge variant="outline" className="border-stroke/30 text-gray-main text-[10px] font-black tracking-[0.3em] bg-white/50 backdrop-blur-sm px-4 py-1.5 rounded-lg uppercase">
                          {viewingTrade.exchange}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6">
                        <h2 className="text-6xl font-black text-black-main tracking-tighter uppercase">{viewingTrade.ticker}</h2>
                        <PriceBadge symbol={viewingTrade.ticker} className="mt-2 scale-110" />
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 text-gray-main">
                          <Calendar className="w-5 h-5" />
                          <span className="text-xs font-black tracking-widest uppercase">{format(parseISO(viewingTrade.entryDate), "PPP p")}</span>
                        </div>
                        <Badge variant="secondary" className={`${viewingTrade.status === "OPEN" ? "bg-info text-white" : "bg-black-main text-white"} font-black text-[10px] tracking-[0.2em] px-4 py-1.5 rounded-lg border-none shadow-md uppercase`}>
                          {viewingTrade.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em] mb-2">Net Expectancy</p>
                      <p className={`text-6xl font-mono font-black tracking-tighter leading-none ${netPnL >= 0 ? "text-success" : "text-destructive"}`}>
                        {netPnL >= 0 ? "+" : "-"}₹{Math.abs(netPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center justify-end gap-2 text-base font-black font-mono mt-2">
                         <span className={`${roi >= 0 ? "text-success" : "text-destructive"}`}>{roi >= 0 ? "+" : ""}{roi.toFixed(2)}%</span>
                         <span className="text-gray-main/30 uppercase text-[10px] tracking-widest">Yield</span>
                      </div>
                    </div>
                  </div>
                  {/* Decorative background element */}
                  <div className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[100px] opacity-30 ${netPnL >= 0 ? "bg-success" : "bg-destructive"}`} />
                </div>

                {/* Content Section */}
                <div className="p-10 grid grid-cols-3 gap-10 bg-bg-app">
                  <div className="col-span-2 space-y-12">
                    {/* Trade Parameters */}
                    <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em]">Entry Benchmark</p>
                        <p className="text-3xl font-mono font-black text-black-main tracking-tighter">₹{viewingTrade.entryPrice.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em]">Exit Benchmark</p>
                        <p className="text-3xl font-mono font-black text-black-main tracking-tighter">{viewingTrade.exitPrice ? `₹${viewingTrade.exitPrice.toLocaleString('en-IN')}` : "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em]">Position Size (Units)</p>
                        <p className="text-3xl font-mono font-black text-black-main tracking-tighter">{viewingTrade.quantity}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em]">Capital Deployment</p>
                        <p className="text-3xl font-mono font-black text-black-main tracking-tighter">₹{(viewingTrade.entryPrice * viewingTrade.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-6 pt-6">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em] whitespace-nowrap">Execution Journal & Insights</span>
                        <div className="h-px flex-1 bg-stroke/30" />
                      </div>
                      <div className="bg-white border border-stroke rounded-lg p-8 min-h-[160px] shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-accent/40 transition-colors" />
                        {viewingTrade.notes ? (
                          <p className="text-base text-gray-main/80 leading-loose whitespace-pre-wrap relative z-10 font-medium italic">"{viewingTrade.notes}"</p>
                        ) : (
                          <p className="text-sm text-gray-main/40 italic relative z-10 font-bold tracking-widest uppercase text-center py-8">No formal insights recorded for this execution.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 bg-accent/20 border border-stroke rounded-lg p-8 h-fit shadow-inner">
                    <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
                      <ShieldCheck className="w-4 h-4 text-black-main" />
                      Cost Dynamics
                    </p>
                    <div className="space-y-5">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-main uppercase text-[10px] tracking-widest px-2 py-0.5 bg-white/50 rounded-md">Brokerage</span>
                        <span className="text-black-main font-mono">₹{charges.brokerage.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-main uppercase text-[10px] tracking-widest px-2 py-0.5 bg-white/50 rounded-md">STT / CTT</span>
                        <span className="text-black-main font-mono">₹{charges.stt.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-gray-main uppercase text-[10px] tracking-widest px-2 py-0.5 bg-white/50 rounded-md">Duty / Stamp</span>
                        <span className="text-black-main font-mono">₹{charges.stampDuty.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-stroke/50 pt-5 mt-2">
                        <span className="font-black text-gray-main uppercase text-[10px] tracking-[0.2em]">Total Friction</span>
                        <span className="text-destructive font-black font-mono text-lg tracking-tighter">₹{charges.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-8 mt-10 border-stroke/50 border-t items-center justify-center">
                      <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-4 h-4 text-gray-main" />
                        <span className="text-[10px] font-black text-gray-main uppercase tracking-[0.3em]">Event Timeline</span>
                      </div>
                      <div className="space-y-6 relative pl-4 border-l border-stroke">
                        <div className="relative">
                           <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-success ring-4 ring-bg-app" />
                           <div className="flex-1">
                             <p className="text-xs font-black text-black-main uppercase tracking-widest">Entry Confirmed</p>
                             <p className="text-[10px] text-gray-main font-mono mt-1 uppercase">{format(parseISO(viewingTrade.entryDate), "MMM d, HH:mm")}</p>
                           </div>
                        </div>
                        {viewingTrade.status === "CLOSED" && viewingTrade.exitDate && (
                          <div className="relative">
                             <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-destructive ring-4 ring-bg-app" />
                             <div className="flex-1">
                               <p className="text-xs font-black text-black-main uppercase tracking-widest">Exit Executed</p>
                               <p className="text-[10px] text-gray-main font-mono mt-1 uppercase">{format(parseISO(viewingTrade.exitDate), "MMM d, HH:mm")}</p>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
