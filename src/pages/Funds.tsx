import * as React from "react";
import { useState, useMemo } from "react";
import { useFunds } from "../hooks/useFunds";
import { FundTransaction } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History, 
  Search, 
  Filter, 
  X, 
  User, 
  Globe, 
  CreditCard as BankIcon, 
  Smartphone as UpiIcon, 
  Coins as CashIcon,
  Calendar as CalendarIcon,
  TrendingUp,
  ArrowRight,
  LayoutGrid,
  Users
} from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const CONTRIBUTORS = ["Prashant", "Raman", "Jaswant"];
const PLATFORMS = ["Zerodha", "Groww", "Upstox", "Angel One"];
const SOURCES = ["Bank", "UPI", "Cash"];

interface FilterChipProps {
  key?: React.Key;
  label: string;
  onRemove: () => void;
}

const FilterChip = ({ label, onRemove }: FilterChipProps) => (
  <div className="flex items-center gap-2 bg-accent/30 border border-stroke px-3 py-1.5 rounded-lg text-[10px] font-black text-black-main uppercase tracking-[0.2em]">
    {label}
    <button onClick={onRemove} className="text-secondary hover:text-black-main transition-colors">
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);

export default function FundsPage() {
  const { transactions, addTransaction, removeTransaction, loading } = useFunds();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("user");
  const [recordMode, setRecordMode] = useState<"individual" | "platform">("individual");
  
  // Sync record mode with active tab when opening modal
  React.useEffect(() => {
    if (isModalOpen) {
      setRecordMode(activeTab === "user" ? "individual" : "platform");
    }
  }, [isModalOpen]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [formData, setFormData] = useState({
    type: "DEPOSIT" as "DEPOSIT" | "WITHDRAWAL",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    addedBy: "Prashant",
    platform: "Zerodha",
    source: "Bank",
    transactionId: "",
    note: ""
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.note?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tx.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesContributor = selectedContributors.length === 0 || selectedContributors.includes(tx.addedBy);
      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(tx.platform);
      
      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const txDate = parseISO(tx.date);
        matchesDate = isWithinInterval(txDate, {
          start: startOfDay(parseISO(dateRange.start)),
          end: endOfDay(parseISO(dateRange.end))
        });
      }

      return matchesSearch && matchesContributor && matchesPlatform && matchesDate;
    });
  }, [transactions, searchQuery, selectedContributors, selectedPlatforms, dateRange]);

  const contributorSummaries = useMemo(() => {
    const totalDepositsAll = transactions
      .filter(t => t.type === "DEPOSIT")
      .reduce((acc, t) => acc + t.amount, 0) || 1;

    return CONTRIBUTORS.map(name => {
      const contributorTx = transactions.filter(t => t.addedBy === name);
      const deposits = contributorTx.filter(t => t.type === "DEPOSIT").reduce((acc, t) => acc + t.amount, 0);
      const withdrawals = contributorTx.filter(t => t.type === "WITHDRAWAL").reduce((acc, t) => acc + t.amount, 0);
      const share = (deposits / totalDepositsAll) * 100;
      return { name, total: deposits - withdrawals, share };
    });
  }, [transactions]);

  const platformBreakdown = useMemo(() => {
    const totalDepositsAll = transactions
      .filter(t => t.type === "DEPOSIT")
      .reduce((acc, t) => acc + t.amount, 0) || 1;

    return PLATFORMS.map(p => {
      const platformTx = transactions.filter(t => t.platform === p);
      const deposits = platformTx.filter(t => t.type === "DEPOSIT").reduce((acc, t) => acc + t.amount, 0);
      const withdrawals = platformTx.filter(t => t.type === "WITHDRAWAL").reduce((acc, t) => acc + t.amount, 0);
      const balance = deposits - withdrawals;
      return { 
        name: p, 
        amount: deposits, 
        balance,
        percentage: (deposits / totalDepositsAll) * 100 
      };
    });
  }, [transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransaction({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    toast.success("Transaction recorded successfully");
    setIsModalOpen(false);
    setFormData({
      type: "DEPOSIT",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      addedBy: "Prashant",
      platform: "Zerodha",
      source: "Bank",
      transactionId: "",
      note: ""
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedContributors([]);
    setSelectedPlatforms([]);
    setDateRange({ start: "", end: "" });
  };

  const toggleFilter = (val: string, current: string[], setter: (v: string[]) => void) => {
    if (current.includes(val)) {
      setter(current.filter(c => c !== val));
    } else {
      setter([...current, val]);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Bank": return <BankIcon className="w-3.5 h-3.5" />;
      case "UPI": return <UpiIcon className="w-3.5 h-3.5" />;
      case "Cash": return <CashIcon className="w-3.5 h-3.5" />;
      default: return <History className="w-3.5 h-3.5" />;
    }
  };

  const renderTransactionTable = (perspective: "user" | "platform") => {
    return (
      <>
        <div className="p-10 pb-0 space-y-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-main" />
              <Input 
                placeholder={`Search ${perspective} journal entries...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white border border-stroke h-14 text-black-main focus:border-black-main transition-all rounded-[1.5rem] font-medium"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {perspective === "user" ? (
                <Select 
                  value="" 
                  onValueChange={(v) => toggleFilter(v, selectedContributors, setSelectedContributors)}
                >
                  <SelectTrigger className="w-[180px] bg-white border border-stroke text-[10px] font-black uppercase tracking-[0.2rem] h-14 text-black-main rounded-[1.5rem] px-5">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-main" />
                      <SelectValue placeholder="Stakeholder" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stroke text-black-main rounded-lg">
                    {CONTRIBUTORS.map(c => (
                      <SelectItem key={c} value={c} className="font-black">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select 
                  value="" 
                  onValueChange={(v) => toggleFilter(v, selectedPlatforms, setSelectedPlatforms)}
                >
                  <SelectTrigger className="w-[180px] bg-white border border-stroke text-[10px] font-black uppercase tracking-[0.2rem] h-14 text-black-main rounded-[1.5rem] px-5">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-main" />
                      <SelectValue placeholder="Terminal" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-stroke text-black-main rounded-lg">
                    {PLATFORMS.map(p => (
                      <SelectItem key={p} value={p} className="font-black">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {(selectedContributors.length > 0 || selectedPlatforms.length > 0) && (
            <div className="flex flex-wrap items-center gap-3">
              {perspective === "user" && selectedContributors.map(c => (
                <FilterChip key={c} label={c} onRemove={() => toggleFilter(c, selectedContributors, setSelectedContributors)} />
              ))}
              {perspective === "platform" && selectedPlatforms.map(p => (
                <FilterChip key={p} label={p} onRemove={() => toggleFilter(p, selectedPlatforms, setSelectedPlatforms)} />
              ))}
              <Button variant="ghost" onClick={clearFilters} className="text-[10px] font-black uppercase tracking-[0.3em] h-10 text-gray-main hover:text-black-main hover:bg-accent/40 rounded-lg px-4">Reset Matrix</Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto mt-8">
          <Table>
            <TableHeader>
              <TableRow className="border-stroke hover:bg-transparent bg-accent/20 h-16">
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main pl-10">Timestamp</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">Nature</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">
                  {perspective === "user" ? "Stakeholder" : "Exchange"}
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">
                  {perspective === "user" ? "Terminal" : "Entity"}
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">Vector</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main text-right pr-10">Quantum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-24 text-gray-main font-black uppercase tracking-widest text-[10px] opacity-30 animate-pulse">Synchronizing Data Grid...</TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-32">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <History className="w-16 h-16 text-black-main" />
                      <p className="text-black-main font-black uppercase text-[10px] tracking-[0.4em]">Zero Invariants Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="border-stroke hover:bg-accent/10 transition-colors group h-20">
                    <TableCell className="text-black-main text-xs pl-10 font-mono font-bold tracking-tight">
                      {format(new Date(tx.date), "dd.MM.yy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-md px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-none",
                        tx.type === 'DEPOSIT' ? 'bg-success-bg text-success' : 'bg-destructive-bg text-destructive'
                      )}>
                        {tx.type === 'DEPOSIT' ? 'Inflow' : 'Outflow'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-black-main text-base font-black tracking-tighter uppercase">
                      {perspective === "user" ? tx.addedBy : tx.platform}
                    </TableCell>
                    <TableCell className="text-gray-main text-[10px] font-black uppercase tracking-[0.15em]">
                      {perspective === "user" ? tx.platform : tx.addedBy}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-gray-main">
                        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          {getSourceIcon(tx.source || "Bank")}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tx.source || "Bank"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                       <div className="flex items-center justify-end gap-6">
                        <span className={cn(
                          "text-xl font-black font-mono tracking-tighter",
                          tx.type === 'DEPOSIT' ? 'text-success' : 'text-destructive'
                        )}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount).replace('₹', '')}
                        </span>
                        <button 
                          onClick={() => removeTransaction(tx.id!)}
                          className="w-10 h-10 rounded-lg bg-destructive-bg/0 hover:bg-destructive-bg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 text-gray-main hover:text-destructive"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-10 pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-black-main tracking-tighter uppercase">Capital Management</h1>
          <p className="text-gray-main font-medium mt-1">Global oversight of equity allocation across stakeholders and terminals.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger 
              render={
                <button className="bg-black-main hover:bg-secondary text-white hover:text-black-main flex items-center gap-3 font-black uppercase tracking-widest px-8 h-12 rounded-lg shadow-xl shadow-black/10 active:scale-[0.98] transition-all text-xs">
                  <Plus className="w-5 h-5" />
                  Record Entry
                </button>
              }
            />
            <DialogContent showCloseButton={false} className="bg-bg-app border-stroke text-black-main sm:max-w-[580px] p-0 overflow-hidden rounded-lg shadow-2xl">
              <div className="flex justify-between items-start p-10 pb-4">
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tighter text-black-main mb-1 uppercase">Ledger Entry</DialogTitle>
                  <p className="text-[10px] text-gray-main uppercase tracking-[0.3em] font-black">Financial Audit Terminal</p>
                </div>
                <DialogClose render={<button className="w-12 h-12 flex items-center justify-center rounded-lg bg-accent/50 hover:bg-accent transition-all text-secondary hover:text-black-main" aria-label="Close" />}>
                  <X className="w-6 h-6" />
                </DialogClose>
              </div>

              <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-8">
                <div className="flex p-1.5 bg-accent/30 border border-stroke rounded-lg h-14">
                  <button
                    type="button"
                    onClick={() => setRecordMode("individual")}
                    className={cn(
                      "flex-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                      recordMode === "individual" ? "bg-white text-black-main shadow-lg" : "text-gray-main hover:text-black-main"
                    )}
                  >
                    <User className="w-4 h-4" />
                    Individual Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordMode("platform")}
                    className={cn(
                      "flex-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                      recordMode === "platform" ? "bg-white text-black-main shadow-lg" : "text-gray-main hover:text-black-main"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    Exchange Hub
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Type</Label>
                    <div className="flex p-1.5 bg-accent/30 border border-stroke rounded-lg h-14">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, type: "DEPOSIT"})}
                        className={cn(
                          "flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.type === "DEPOSIT" ? "bg-success text-white shadow-lg shadow-success/20" : "text-gray-main hover:text-black-main"
                        )}
                      >
                        Inflow
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, type: "WITHDRAWAL"})}
                        className={cn(
                          "flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          formData.type === "WITHDRAWAL" ? "bg-destructive text-white shadow-lg shadow-destructive/20" : "text-gray-main hover:text-black-main"
                        )}
                      >
                        Outflow
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Quantum (₹)</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-60">
                        <CashIcon className="w-5 h-5 text-gray-main" />
                      </div>
                      <Input 
                        type="number" 
                        value={formData.amount} 
                        onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                        placeholder="0.00"
                        className="bg-white border-stroke h-14 pl-12 rounded-lg font-mono text-xl font-black text-black-main focus:border-black-main transition-all placeholder:text-gray-main/30" 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {recordMode === "individual" ? (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Stakeholder</Label>
                      <Select value={formData.addedBy} onValueChange={(v) => setFormData({...formData, addedBy: v})}>
                        <SelectTrigger className="bg-white border-stroke text-black-main h-16 rounded-lg focus:ring-0 focus:border-black-main w-full shadow-none transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center">
                              <User className="w-4 h-4 text-black-main" />
                            </div>
                            <SelectValue className="font-black" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-stroke text-black-main shadow-2xl rounded-lg">
                          {CONTRIBUTORS.map(c => <SelectItem key={c} value={c} className="font-black text-black-main">{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-gray-main font-bold italic tracking-tight px-1">Note: Individual allocation defaults to Primary Platform.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Terminal Hub</Label>
                      <Select value={formData.platform} onValueChange={(v) => setFormData({...formData, platform: v})}>
                        <SelectTrigger className="bg-white border-stroke text-black-main h-16 rounded-lg focus:ring-0 focus:border-black-main w-full shadow-none transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center">
                              <Globe className="w-4 h-4 text-black-main" />
                            </div>
                            <SelectValue className="font-black" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-stroke text-black-main shadow-2xl rounded-lg">
                          {PLATFORMS.map(p => <SelectItem key={p} value={p} className="font-black text-black-main">{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-gray-main font-bold italic tracking-tight px-1">Note: Hub entries are attributed to Admin Oversight.</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Timestamp</Label>
                    <div className="relative">
                       <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-main pointer-events-none" />
                       <Input 
                        type="datetime-local" 
                        value={formData.date} 
                        onChange={(e) => setFormData({...formData, date: e.target.value})} 
                        className="bg-white border-stroke h-14 pl-12 pr-4 rounded-lg focus:border-black-main text-xs font-black text-black-main transition-all" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Vector</Label>
                    <Select value={formData.source} onValueChange={(v) => setFormData({...formData, source: v})}>
                      <SelectTrigger className="bg-white border-stroke text-black-main h-14 rounded-lg focus:ring-0 focus:border-black-main w-full shadow-none transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-lg bg-accent/50 flex items-center justify-center">
                            <BankIcon className="w-4 h-4 text-black-main" />
                          </div>
                          <SelectValue className="font-black" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white border-stroke text-black-main shadow-2xl rounded-lg">
                        {SOURCES.map(s => <SelectItem key={s} value={s} className="font-black text-black-main">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] ml-1">Reference Metadata</Label>
                  <div className="grid grid-cols-2 gap-8">
                    <Input 
                      value={formData.transactionId} 
                      onChange={(e) => setFormData({...formData, transactionId: e.target.value})} 
                      placeholder="Audit ID"
                      className="bg-white border-stroke h-14 rounded-lg px-6 focus:border-black-main transition-all placeholder:text-gray-main/30 text-xs font-black uppercase tracking-widest" 
                    />
                    <Input 
                      value={formData.note} 
                      onChange={(e) => setFormData({...formData, note: e.target.value})} 
                      placeholder="Commentary"
                      className="bg-white border-stroke h-14 rounded-lg px-6 focus:border-black-main transition-all placeholder:text-gray-main/30 text-xs font-black uppercase tracking-widest" 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-8 pt-8 border-t border-stroke/30">
                  <DialogClose render={<button type="button" className="text-gray-main hover:text-black-main transition-colors text-[10px] font-black uppercase tracking-[0.3em] px-4">Discard</button>} />
                  <Button type="submit" className="flex-1 bg-black-main hover:bg-secondary text-white hover:text-black-main font-black uppercase tracking-[0.2em] h-16 rounded-lg shadow-2xl shadow-black/20 active:scale-[0.98] transition-all text-xs">
                    Commit Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-accent/40 p-1.5 rounded-lg h-14 mb-10 w-fit backdrop-blur-sm shadow-inner">
          <TabsTrigger value="user" className="flex items-center gap-3 px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-black-main rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-gray-main transition-all">
            <Users className="w-5 h-5" />
            Stakeholder Insights
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-3 px-8 h-full data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-black-main rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-gray-main transition-all">
            <LayoutGrid className="w-5 h-5" />
            Terminal Allocation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user" className="space-y-12 mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contributorSummaries.map((summary) => (
              <motion.div 
                key={summary.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-10 rounded-lg border border-stroke shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-accent/40 transition-colors" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-main leading-none">{summary.name}</span>
                  <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm group-hover:bg-white group-hover:text-black-main transition-colors">
                    <User className="w-7 h-7 text-secondary group-hover:text-black-main" />
                  </div>
                </div>
                <p className="text-4xl font-black text-black-main mb-8 font-mono tracking-tighter relative z-10">
                  ₹{summary.total.toLocaleString('en-IN')}
                </p>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between text-[10px] uppercase font-black text-gray-main tracking-[0.2em]">
                    <span>Capital Stake</span>
                    <span>{Math.round(summary.share)}%</span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${summary.share}%` }}
                      className="h-full bg-black-main rounded-full shadow-[2px_0_10px_rgba(0,0,0,0.1)]"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="bg-white border border-stroke rounded-lg overflow-hidden shadow-xl shadow-slate-200/40">
            <div className="p-10 border-b border-stroke/30 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-black-main tracking-tighter uppercase">Stakeholder Ledger</h3>
                <p className="text-[10px] text-gray-main mt-1 font-black uppercase tracking-[0.2em]">Complete repository of personal capital injections</p>
              </div>
              <div className="w-12 h-12 bg-accent/50 rounded-lg flex items-center justify-center">
                 <History className="w-6 h-6 text-gray-main" />
              </div>
            </div>
            {renderTransactionTable("user")}
          </div>
        </TabsContent>

        <TabsContent value="platform" className="space-y-12 mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {platformBreakdown.map((p, i) => (
              <motion.div 
                key={p.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-10 rounded-lg border border-stroke shadow-sm group hover:border-black-main hover:shadow-2xl hover:shadow-slate-200/50 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/30 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-accent/60 transition-colors" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-main leading-none">{p.name}</span>
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center transition-all group-hover:bg-white group-hover:shadow-md",
                    "bg-accent"
                  )}>
                    <Globe className="w-6 h-6 text-secondary group-hover:text-black-main" />
                  </div>
                </div>
                <p className="text-3xl font-black text-black-main mb-2 font-mono tracking-tighter relative z-10">
                  ₹{p.balance.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] font-black text-gray-main uppercase tracking-[0.2em] mb-8 relative z-10">
                  Net Asset Value
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-stroke/30 relative z-10">
                   <span className="text-[10px] font-black text-gray-main uppercase tracking-widest">Weighting</span>
                   <span className="text-sm font-black text-black-main font-mono">{Math.round(p.percentage)}%</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white border border-stroke rounded-lg overflow-hidden shadow-xl shadow-slate-200/40">
            <div className="p-10 border-b border-stroke/30 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-black-main tracking-tighter uppercase">Exchange Distribution</h3>
                <p className="text-[10px] text-gray-main mt-1 font-black uppercase tracking-[0.2em]">Omni-channel hub for platform-level fund movement</p>
              </div>
              <div className="w-12 h-12 bg-accent/50 rounded-lg flex items-center justify-center">
                 <Globe className="w-6 h-6 text-gray-main" />
              </div>
            </div>
            {renderTransactionTable("platform")}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
