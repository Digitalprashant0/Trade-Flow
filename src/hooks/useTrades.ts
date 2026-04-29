import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Trade } from "../types";
import { handleFirestoreError, OperationType } from "../lib/error-handler";

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setTrades([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "trades"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("entryDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[];
      setTrades(tradeList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "trades");
    });

    return () => unsubscribe();
  }, []);

  const addTrade = async (trade: Omit<Trade, "id" | "userId" | "createdAt">) => {
    if (!auth.currentUser) return;
    try {
      // Logic to find match for merging (matching ticket, direction, exchange and must be OPEN)
      const existingTrade = trades.find(t => 
        t.ticker.toUpperCase() === trade.ticker.toUpperCase() && 
        t.direction === trade.direction && 
        t.exchange === trade.exchange &&
        t.status === "OPEN" &&
        trade.status === "OPEN"
      );

      if (existingTrade && existingTrade.id) {
        const totalQty = existingTrade.quantity + trade.quantity;
        // Formula: ((Qty1 * Price1) + (Qty2 * Price2)) / (Qty1 + Qty2)
        const avgPrice = ((existingTrade.quantity * existingTrade.entryPrice) + (trade.quantity * trade.entryPrice)) / totalQty;
        
        await updateTrade(existingTrade.id, {
          quantity: totalQty,
          entryPrice: Number(avgPrice.toFixed(4)), // Keep precision for fractions
          notes: existingTrade.notes 
            ? `${existingTrade.notes}\n[Merged ${trade.quantity} @ ${trade.entryPrice} on ${new Date().toLocaleDateString()}]` 
            : `Merged ${trade.quantity} @ ${trade.entryPrice} on ${new Date().toLocaleDateString()}`
        });
        return;
      }

      // Remove undefined fields before sending to Firestore
      const sanitizedTrade = JSON.parse(JSON.stringify(trade));
      await addDoc(collection(db, "trades"), {
        ...sanitizedTrade,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "trades");
    }
  };

  const updateTrade = async (id: string, trade: Partial<Trade>) => {
    try {
      const sanitizedTrade = JSON.parse(JSON.stringify(trade));
      const tradeRef = doc(db, "trades", id);
      await updateDoc(tradeRef, sanitizedTrade);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `trades/${id}`);
    }
  };

  const removeTrade = async (id: string) => {
    try {
      await deleteDoc(doc(db, "trades", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trades/${id}`);
    }
  };

  return { trades, loading, addTrade, updateTrade, removeTrade };
}
