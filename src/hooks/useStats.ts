import { useMemo } from "react";
import { Trade, FundTransaction } from "../types";
import { calculateZerodhaCharges, calculatePnL } from "../lib/calculations";
import { isAfter, parseISO, startOfMonth, format, startOfWeek } from "date-fns";

export function useStats(trades: Trade[], transactions: FundTransaction[]) {
  return useMemo(() => {
    let totalGrossPnL = 0;
    let totalNetPnL = 0;
    let totalCharges = 0;
    let winCount = 0;
    let lossCount = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;
    let totalWinAmount = 0;
    let totalLossAmount = 0;

    const closedTrades = trades.filter(t => t.status === "CLOSED");
    const openTrades = trades.filter(t => t.status === "OPEN");

    closedTrades.forEach(trade => {
      const charges = calculateZerodhaCharges({
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        exchange: trade.exchange,
        status: trade.status
      });

      const { grossPnL, netPnL } = calculatePnL({
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        direction: trade.direction,
        charges: charges.total
      });

      totalGrossPnL += grossPnL;
      totalNetPnL += netPnL;
      totalCharges += charges.total;

      if (netPnL > 0) {
        winCount++;
        totalWinAmount += netPnL;
        if (netPnL > bestTrade) bestTrade = netPnL;
      } else {
        lossCount++;
        totalLossAmount += Math.abs(netPnL);
        if (netPnL < worstTrade) worstTrade = netPnL;
      }
    });

    // Account for charges on open trades (buy side)
    openTrades.forEach(trade => {
      const charges = calculateZerodhaCharges({
        entryPrice: trade.entryPrice,
        quantity: trade.quantity,
        exchange: trade.exchange,
        status: trade.status
      });
      totalCharges += charges.total;
      totalNetPnL -= charges.total;
    });

    const totalTrades = closedTrades.length;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? Infinity : 0;
    const averageWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const averageLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;

    const sortedTrades = [...closedTrades].sort((a, b) => 
      parseISO(a.exitDate!).getTime() - parseISO(b.exitDate!).getTime()
    );

    // Advanced Stats
    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    
    sortedTrades.forEach(trade => {
      const charges = calculateZerodhaCharges({
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        exchange: trade.exchange,
        status: trade.status
      }).total;
      const { netPnL } = calculatePnL({
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        direction: trade.direction,
        charges
      });

      if (netPnL > 0) {
        currentWins++;
        currentLosses = 0;
        if (currentWins > maxWins) maxWins = currentWins;
      } else {
        currentLosses++;
        currentWins = 0;
        if (currentLosses > maxLosses) maxLosses = currentLosses;
      }
    });

    let cumulativePnL = 0;
    const equityCurve = sortedTrades.map(trade => {
      const charges = calculateZerodhaCharges({
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        exchange: trade.exchange,
        status: trade.status
      }).total;
      const { netPnL } = calculatePnL({
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        direction: trade.direction,
        charges
      });
      cumulativePnL += netPnL;
      return { 
        date: format(parseISO(trade.exitDate!), "MMM dd"), 
        value: Number(cumulativePnL.toFixed(2)) 
      };
    });

    // Account Balance Chart Data
    const balanceEvents = [
      ...transactions.map(t => ({ 
        date: parseISO(t.date), 
        amount: t.type === "DEPOSIT" ? t.amount : -t.amount,
        type: t.type
      })),
      ...sortedTrades.map(trade => {
        const charges = calculateZerodhaCharges({
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          exchange: trade.exchange,
          status: trade.status
        }).total;
        const { netPnL } = calculatePnL({
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          quantity: trade.quantity,
          direction: trade.direction,
          charges
        });
        return { 
          date: parseISO(trade.exitDate!), 
          amount: netPnL,
          type: "TRADE"
        };
      })
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;
    const balanceHistory = balanceEvents.map(event => {
      runningBalance += event.amount;
      return {
        date: format(event.date, "MMM dd"),
        balance: Number(runningBalance.toFixed(2))
      };
    });

    return {
      netPnL: totalNetPnL,
      grossPnL: totalGrossPnL,
      totalCharges,
      winRate,
      totalTrades,
      averageWin,
      averageLoss,
      profitFactor,
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade,
      maxWins,
      maxLosses,
      equityCurve,
      balanceHistory,
      openTrades
    };
  }, [trades, transactions]);
}
