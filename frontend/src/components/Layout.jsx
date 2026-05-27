import React, { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { apiUrl } from "../utils/api";
import { getStoredUserId } from "../utils/authStorage";
import {
  migrateLegacyTransactions,
  readStoredTransactions,
  removeLegacyTransactionKeys,
  writeStoredTransactions,
} from "../utils/transactionStore";

const demoTransactions = [];

const sortByDateDesc = (items) =>
  [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

const getTransactionId = (transaction) => transaction?._id || transaction?.id;

const getTransactionSignature = (transaction) =>
  {
    const parsedDate = new Date(transaction?.date || "");
    const dateKey = Number.isNaN(parsedDate.getTime())
      ? String(transaction?.date || "")
      : parsedDate.toISOString();

    return [
      transaction?.type || "",
      String(transaction?.description || "").trim().toLowerCase(),
      Number(transaction?.amount || 0),
      String(transaction?.category || "").trim().toLowerCase(),
      dateKey,
    ].join("|");
  };

const getTransactionKey = (transaction) => {
  if (transaction?.clientId) return `client:${transaction.clientId}`;

  const id = getTransactionId(transaction);
  if (id && !String(id).startsWith("local-")) return `id:${id}`;

  return `sig:${getTransactionSignature(transaction)}`;
};

const createLocalId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `local-${crypto.randomUUID()}`;
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const normalizeTransaction = (transaction) => {
  const id = getTransactionId(transaction) || createLocalId();

  return {
    ...transaction,
    id,
    clientId: transaction.clientId || id,
    amount: Number(transaction.amount || 0),
    date: transaction.date || new Date().toISOString(),
  };
};

const mergeTransactions = (primary, secondary) => {
  const merged = [];
  const keyToIndex = new Map();
  const signatureToIndex = new Map();

  const addOrReplace = (transaction) => {
    const normalized = normalizeTransaction(transaction);
    const key = getTransactionKey(normalized);
    const signature = getTransactionSignature(normalized);
    const existingIndex = keyToIndex.has(key)
      ? keyToIndex.get(key)
      : signatureToIndex.get(signature);

    if (existingIndex !== undefined) {
      const existing = merged[existingIndex];
      const existingId = getTransactionId(existing);
      const nextId = getTransactionId(normalized);
      const shouldPreferNext =
        (nextId && !String(nextId).startsWith("local-")) ||
        (!existingId && nextId);

      merged[existingIndex] = shouldPreferNext
        ? { ...existing, ...normalized }
        : { ...normalized, ...existing };

      keyToIndex.set(getTransactionKey(merged[existingIndex]), existingIndex);
      signatureToIndex.set(getTransactionSignature(merged[existingIndex]), existingIndex);
      return;
    }

    keyToIndex.set(key, merged.length);
    signatureToIndex.set(signature, merged.length);
    merged.push(normalized);
  };

  [...primary, ...secondary].forEach(addOrReplace);

  return sortByDateDesc(merged);
};

const Layout = () => {
  const [transactions, setTransactions] = useState(demoTransactions);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [timeFrame, setTimeFrame] = useState("monthly");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const userId = getStoredUserId() || "guest";

  const fetchTransactions = useCallback(async () => {
    const activeUserId = getStoredUserId();
    if (!activeUserId) return null;

    try {
      const [expRes, incRes] = await Promise.all([
        axios.get(apiUrl(`/expense/get?userId=${activeUserId}`)),
        axios.get(apiUrl(`/income/get?userId=${activeUserId}`)),
      ]);

      if (expRes.data.success && incRes.data.success) {
        const fetched = [
          ...expRes.data.data.map((t) => ({ ...t, type: "expense" })),
          ...incRes.data.data.map((t) => ({ ...t, type: "income" })),
        ];

        setTransactions((current) => mergeTransactions(current, fetched));
      }
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadTransactions = async () => {
      const migrated = await migrateLegacyTransactions(userId);
      removeLegacyTransactionKeys();
      const stored = migrated.length
        ? migrated
        : await readStoredTransactions(userId);

      if (isMounted) {
        setTransactions(
          stored.length
            ? mergeTransactions(stored, [])
            : demoTransactions,
        );
        setTransactionsLoaded(true);
      }
    };

    loadTransactions();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!transactionsLoaded) return;
    writeStoredTransactions(userId, transactions);
  }, [transactions, transactionsLoaded, userId]);

  useEffect(() => {
    if (!transactionsLoaded) return undefined;

    const timeoutId = window.setTimeout(() => {
      fetchTransactions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchTransactions, transactionsLoaded]);

  const refreshTransactions = useCallback(async () => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(async (transaction) => {
    const nextTransaction = normalizeTransaction({
      ...transaction,
      amount: Number(transaction.amount),
      date: transaction.date || new Date().toISOString(),
      userId,
    });

    setTransactions((current) => mergeTransactions([nextTransaction], current));

    try {
      const endpoint = transaction.type === "expense" ? "/expense/add" : "/income/add";
      const response = await axios.post(apiUrl(endpoint), nextTransaction);

      if (response.data?.data) {
        const syncedTransaction = normalizeTransaction({
          ...response.data.data,
          id: getTransactionId(response.data.data) || nextTransaction.id,
          type: nextTransaction.type,
        });

        setTransactions((current) =>
          mergeTransactions(
            [syncedTransaction],
            current.filter((item) => getTransactionId(item) !== nextTransaction.id),
          ),
        );
      }

      return nextTransaction;
    } catch {
      return nextTransaction;
    }
  }, [userId]);

  const updateTransaction = useCallback(async (id, updates) => {
    const trans = transactions.find((t) => getTransactionId(t) === id);
    if (!trans) return null;

    const updatedTransaction = normalizeTransaction({
      ...trans,
      ...updates,
      id,
      _id: trans._id,
      amount: Number(updates.amount ?? trans.amount),
    });

    setTransactions((current) =>
      mergeTransactions(
        [updatedTransaction],
        current.filter((item) => getTransactionId(item) !== id),
      ),
    );

    try {
      const endpoint = trans.type === "expense" ? `/expense/update/${id}` : `/income/update/${id}`;
      await axios.put(apiUrl(endpoint), updates);
      return updatedTransaction;
    } catch {
      return updatedTransaction;
    }
  }, [transactions]);

  const deleteTransaction = useCallback(async (id) => {
    const trans = transactions.find((t) => getTransactionId(t) === id);
    if (!trans) return null;

    setTransactions((current) =>
      current.filter((item) => getTransactionId(item) !== id),
    );

    try {
      const endpoint = trans.type === "expense" ? `/expense/delete/${id}` : `/income/delete/${id}`;
      await axios.delete(apiUrl(endpoint));
      return id;
    } catch {
      return id;
    }
  }, [transactions]);

  const outletContext = {
    transactions,
    refreshTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    timeFrame,
    setTimeFrame,
    loading: false,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <div>
        <Sidebar isCollapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <main
          className={`min-h-screen border-slate-200 bg-slate-50 pt-20 transition-all duration-300 lg:border-l ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
};

export default Layout;
