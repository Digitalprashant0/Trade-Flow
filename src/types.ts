export type Direction = "LONG" | "SHORT";
export type TradeStatus = "OPEN" | "CLOSED";
export type Exchange = "NSE" | "BSE";

export interface Trade {
  id?: string;
  userId: string;
  ticker: string;
  direction: Direction;
  status: TradeStatus;
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
  tags?: string[];
  exchange: Exchange;
  createdAt: string;
}

export interface FundTransaction {
  id?: string;
  userId: string;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  date: string;
  addedBy: string;
  platform: string;
  source: string;
  transactionId?: string;
  note?: string;
  createdAt: string;
}
