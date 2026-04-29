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
  orderBy 
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { FundTransaction } from "../types";
import { handleFirestoreError, OperationType } from "../lib/error-handler";

export function useFunds() {
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FundTransaction[];
      setTransactions(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "transactions");
    });

    return () => unsubscribe();
  }, []);

  const addTransaction = async (tx: Omit<FundTransaction, "id" | "userId" | "createdAt">) => {
    if (!auth.currentUser) return;
    try {
      const sanitizedTx = JSON.parse(JSON.stringify(tx));
      await addDoc(collection(db, "transactions"), {
        ...sanitizedTx,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "transactions");
    }
  };

  const updateTransaction = async (id: string, tx: Partial<FundTransaction>) => {
    try {
      const sanitizedTx = JSON.parse(JSON.stringify(tx));
      const txRef = doc(db, "transactions", id);
      await updateDoc(txRef, sanitizedTx);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    }
  };

  const removeTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  return { transactions, loading, addTransaction, updateTransaction, removeTransaction };
}
