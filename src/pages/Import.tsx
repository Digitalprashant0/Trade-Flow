import * as React from "react";
import { useState } from "react";
import { useTrades } from "../hooks/useTrades";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { cn } from "../lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { read, utils } from "xlsx";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { Meteors } from "../components/magicui/meteors";

export default function ImportPage() {
  const { addTrade } = useTrades();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      if (isExcel) {
        parseExcel(selectedFile);
      } else {
        parseCSV(selectedFile);
      }
    }
  };

  const parseExcel = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = utils.sheet_to_json(worksheet);
      
      // Normalize keys to lowercase for mapping
      const normalizedData = jsonData.map((row: any) => {
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase().replace(/\s+/g, '')] = row[key];
        });
        return normalizedRow;
      });
      
      setPreview(normalizedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
      
      const data = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(",").map(v => v.trim());
        const trade: any = {};
        headers.forEach((header, index) => {
          trade[header] = values[index];
        });
        return trade;
      });
      setPreview(data);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      for (const item of preview) {
        // Map common CSV/Excel headers to our Trade schema
        await addTrade({
          ticker: item.ticker || item.symbol || item.stock || "Unknown",
          direction: (item.direction || item.type || "LONG").toUpperCase() as any,
          exchange: (item.exchange || "NSE").toUpperCase() as any,
          status: (item.status || "CLOSED").toUpperCase() as any,
          entryPrice: parseFloat(item.entryprice || item.entry || 0),
          exitPrice: item.exitprice || item.exit ? parseFloat(item.exitprice || item.exit) : undefined,
          quantity: parseFloat(item.quantity || item.qty || 1),
          entryDate: item.entrydate || new Date().toISOString(),
          exitDate: item.exitdate,
          stopLoss: item.stoploss ? parseFloat(item.stoploss) : undefined,
          notes: item.notes || `Imported on ${format(new Date(), "PP")}`
        });
      }
      toast.success(`Successfully imported ${preview.length} trades`);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b']
      });
      setFile(null);
      setPreview([]);
    } catch (error) {
      toast.error("An error occurred during import");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const removeRow = (index: number) => {
    setPreview(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-12 relative overflow-hidden">
      <Meteors number={20} className="opacity-10" />
      <div className="relative z-10">
        <h1 className="text-5xl font-black text-black-main tracking-tighter uppercase">Data Gateway</h1>
        <p className="text-gray-main font-medium mt-1 uppercase tracking-widest text-xs">Omni-channel ingestion for terminal historical data.</p>
      </div>

      <Card className="bg-white border-stroke border-dashed border-2 rounded-lg shadow-xl shadow-black/5 overflow-hidden group hover:border-black-main transition-all">
        <CardContent className="py-24">
          <div className="flex flex-col items-center text-center space-y-10">
            <div className="w-24 h-24 bg-accent rounded-lg flex items-center justify-center border border-stroke shadow-sm group-hover:scale-110 transition-transform">
              <Upload className="w-12 h-12 text-black-main" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-black-main uppercase tracking-tighter">Select Source Vector</h3>
              <p className="text-[10px] text-gray-main max-w-sm font-black uppercase tracking-[0.3em] leading-relaxed px-8">
                Recognized Protocol: <span className="text-black-main">Ticker, Vector, Entry, Exit, volume, Timestamp</span>
              </p>
            </div>
            <div className="flex gap-4 pt-4">
               <Input 
                 type="file" 
                 accept=".csv, .xlsx, .xls" 
                 onChange={handleFileChange} 
                 className="hidden" 
                 id="csv-upload"
               />
               <Button className="bg-black-main hover:bg-secondary text-white hover:text-black-main px-12 h-16 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] pointer-events-auto cursor-pointer shadow-2xl shadow-black/20" render={<label htmlFor="csv-upload" />} nativeButton={false}>
                 Access Local Drive
               </Button>
            </div>
            {file && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-success font-black flex items-center gap-3 bg-success-bg px-6 py-3 rounded-lg border border-success/20 tracking-[0.2em] uppercase"
              >
                <CheckCircle2 className="w-4 h-4" /> 
                {file.name}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card className="bg-white border-stroke shadow-2xl rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="flex flex-row items-center justify-between border-b border-stroke/30 p-10 bg-accent/20">
            <div>
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-main">Digest Preview</CardTitle>
              <p className="text-[10px] font-black text-black-main mt-1 uppercase tracking-[0.2em]">{preview.length} Rows Identified</p>
            </div>
            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="bg-black-main hover:bg-secondary text-white hover:text-black-main rounded-lg px-10 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-black/10"
            >
              {importing ? "Processing..." : "Commit Digest"}
            </Button>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-stroke bg-accent/10 h-16">
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main pl-10">Identifier</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main">Vector</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main text-right">Entry</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main text-right">Exit</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main text-right">Volume</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-main text-right pr-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, i) => (
                  <TableRow key={i} className="border-stroke hover:bg-accent/10 transition-colors h-20">
                    <TableCell className="text-black-main font-black font-mono tracking-tighter text-xl pl-10 uppercase">{row.ticker || row.symbol || row.stock}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black tracking-[0.2em] uppercase border",
                        (row.direction || row.type || '').toUpperCase() === 'LONG' || (row.direction || row.type || '').toUpperCase() === 'BUY'
                          ? 'bg-success-bg text-success border-success/10'
                          : 'bg-destructive-bg text-destructive border-destructive/10'
                      )}>
                        {row.direction || row.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-gray-main font-black font-mono text-base">₹{row.entryprice || row.entry}</TableCell>
                    <TableCell className="text-right text-gray-main font-black font-mono text-base">{row.exitprice || row.exit ? `₹${row.exitprice || row.exit}` : "-"}</TableCell>
                    <TableCell className="text-right text-black-main font-black font-mono text-base">{row.quantity || row.qty}</TableCell>
                    <TableCell className="text-right pr-10">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeRow(i)}
                        className="h-12 w-12 text-gray-main hover:text-destructive hover:bg-destructive-bg rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <div className="bg-accent/30 border border-stroke p-10 rounded-lg flex gap-8 shadow-sm">
        <div className="bg-black-main p-4 rounded-lg h-fit shadow-xl shadow-black/10">
          <AlertCircle className="w-8 h-8 text-white shrink-0" />
        </div>
        <div className="space-y-2">
          <p className="font-black text-black-main uppercase tracking-[0.4em] text-[12px] mb-2 leading-none">Protocol Guidelines</p>
          <p className="text-gray-main font-medium leading-relaxed max-w-2xl text-sm italic">
            For seamless ingestion, ensure column headers align with specified vectors. Non-standardized data may result in integrity failure within the vantage journal matrix.
          </p>
        </div>
      </div>
    </div>
  );
}
