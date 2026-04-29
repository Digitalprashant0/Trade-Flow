import { Exchange, Direction, TradeStatus } from "../types";

export interface ChargesBreakdown {
  brokerage: number;
  stt: number;
  stampDuty: number;
  txnCharges: number;
  sebiCharges: number;
  gst: number;
  total: number;
}

export function calculateZerodhaCharges({
  entryPrice,
  exitPrice,
  quantity,
  exchange = "NSE",
  status = "CLOSED"
}: {
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  exchange?: Exchange;
  status?: TradeStatus;
}): ChargesBreakdown {
  const buyValue = entryPrice * quantity;
  const sellValue = (exitPrice || entryPrice) * quantity;

  const txnRate = exchange === "NSE" ? 0.0000307 : 0.0000375;
  
  // Simplified Brokerage: ₹20 per side for non-delivery, or ₹0 for NSE delivery (Equity)
  // Since we don't have "Intraday/Delivery" toggle yet, we'll assume a flat ₹20 for non-zero prices
  const brokerageBuy = buyValue > 0 ? 20 : 0;
  let brokerageSell = (status === "CLOSED" && sellValue > 0) ? 20 : 0;

  // Side Note: Zerodha is ₹0 brokerage for Equity Delivery on NSE. 
  // If we wanted to be more accurate we'd need more info.

  // BUY Side
  const sttBuy = 0.001 * buyValue;
  const stampDuty = 0.00015 * buyValue;
  const txnBuy = txnRate * buyValue;
  const sebiBuy = 0.000001 * buyValue;
  const gstBuy = 0.18 * (brokerageBuy + txnBuy + sebiBuy);

  let sttSell = 0;
  let txnSell = 0;
  let sebiSell = 0;
  let gstSell = 0;

  // SELL Side
  if (status === "CLOSED" && exitPrice) {
    sttSell = 0.001 * sellValue;
    txnSell = txnRate * sellValue;
    sebiSell = 0.000001 * sellValue;
    gstSell = 0.18 * (brokerageSell + txnSell + sebiSell);
  }

  const totalBrokerage = brokerageBuy + brokerageSell;
  const total = totalBrokerage + sttBuy + sttSell + stampDuty + txnBuy + txnSell + sebiBuy + sebiSell + gstBuy + gstSell;

  return {
    brokerage: totalBrokerage,
    stt: sttBuy + sttSell,
    stampDuty,
    txnCharges: txnBuy + txnSell,
    sebiCharges: sebiBuy + sebiSell,
    gst: gstBuy + gstSell,
    total
  };
}

export function calculatePnL({
  entryPrice,
  exitPrice,
  quantity,
  direction,
  charges
}: {
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  direction: Direction;
  charges: number;
}) {
  const investAmount = entryPrice * quantity;
  
  if (!exitPrice) {
    const netPnL = -charges;
    const roi = investAmount > 0 ? (netPnL / investAmount) * 100 : 0;
    return { grossPnL: 0, netPnL, roi };
  }

  const grossPnL = direction === "LONG"
    ? (exitPrice - entryPrice) * quantity
    : (entryPrice - exitPrice) * quantity;

  const netPnL = grossPnL - charges;
  const roi = investAmount > 0 ? (netPnL / investAmount) * 100 : 0;

  return { grossPnL, netPnL, roi };
}
