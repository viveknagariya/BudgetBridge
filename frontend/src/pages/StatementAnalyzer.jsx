import React, { useMemo, useState } from "react";
import {
  Upload,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  AlertCircle,
  ListChecks,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import { apiUrl } from "../utils/api";
import { formatINR } from "../utils/currency";
import { exportToExcel } from "../utils/exportUtils";

const getDebitAmount = (transaction) =>
  Number(transaction.debitAmount || 0);

const getCreditAmount = (transaction) =>
  Number(transaction.creditAmount || 0);

const getBalance = (transaction) => Number(transaction.balance || 0);

const roundAmount = (amount) => Math.round(Number(amount || 0) * 100) / 100;

const getDisplayTransactions = (transactions) => {
  let previousBalance = null;

  return transactions.map((transaction) => {
    const balance = getBalance(transaction);
    const debitAmount = getDebitAmount(transaction);
    const creditAmount = getCreditAmount(transaction);

    if (!previousBalance || !balance) {
      previousBalance = balance || previousBalance;
      return transaction;
    }

    const balanceDiff = roundAmount(balance - previousBalance);
    previousBalance = balance;

    if (balanceDiff === 0) return transaction;

    const expectedAmount = Math.abs(balanceDiff);
    const currentAmount = debitAmount || creditAmount;
    const currentLooksWrong =
      !currentAmount ||
      Math.abs(currentAmount - expectedAmount) > 0.05 ||
      Math.abs(currentAmount - balance) <= 0.05;

    if (!currentLooksWrong) return transaction;

    return {
      ...transaction,
      amount: expectedAmount,
      type: balanceDiff > 0 ? "income" : "expense",
      debitAmount: balanceDiff < 0 ? expectedAmount : 0,
      creditAmount: balanceDiff > 0 ? expectedAmount : 0,
    };
  });
};

const StatementAnalyzer = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalCredit: 0,
    totalDebit: 0,
    totalTransactions: 0,
    netFlow: 0,
    finalBalance: 0,
    categorySummary: [],
  });
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");

  const displayTransactions = useMemo(
    () => getDisplayTransactions(transactions),
    [transactions],
  );

  const displaySummary = useMemo(() => {
    if (displayTransactions.length === 0) return summary;

    const totals = displayTransactions.reduce(
      (acc, transaction) => {
        acc.totalDebit += getDebitAmount(transaction);
        acc.totalCredit += getCreditAmount(transaction);

        const balance = getBalance(transaction);
        if (balance > 0) {
          acc.finalBalance = balance;
        }

        return acc;
      },
      {
        totalCredit: 0,
        totalDebit: 0,
        totalTransactions: displayTransactions.length,
        finalBalance: 0,
      },
    );

    return {
      ...summary,
      totalCredit: Math.round(totals.totalCredit * 100) / 100,
      totalDebit: Math.round(totals.totalDebit * 100) / 100,
      totalTransactions: totals.totalTransactions,
      netFlow:
        Math.round((totals.totalCredit - totals.totalDebit) * 100) / 100,
      finalBalance: totals.finalBalance || summary.finalBalance,
    };
  }, [displayTransactions, summary]);

  const chartData = useMemo(
    () => [
      { name: "Credit", amount: displaySummary.totalCredit, fill: "#10b981" },
      { name: "Debit", amount: displaySummary.totalDebit, fill: "#f97316" },
    ],
    [displaySummary.totalCredit, displaySummary.totalDebit],
  );

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setFileName(file.name);
    setTransactions([]);
    setSummary({
      totalCredit: 0,
      totalDebit: 0,
      totalTransactions: 0,
      netFlow: 0,
      finalBalance: 0,
      categorySummary: [],
    });

    try {
      const formData = new FormData();
      formData.append("statement", file);
      if (pdfPassword) {
        formData.append("password", pdfPassword);
      }

      const res = await axios.post(apiUrl("/statements/analyze"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const payload = res.data?.data || {};

      setTransactions(payload.transactions || []);
      setSummary(
        payload.summary || {
          totalCredit: 0,
          totalDebit: 0,
          totalTransactions: 0,
          netFlow: 0,
          finalBalance: 0,
          categorySummary: [],
        },
      );

      if ((payload.transactions || []).length === 0) {
        setError(
          "Statement upload ho gaya, but transactions detect nahi hue. PDF password protected, low quality scan, ya bank format different ho sakta hai.",
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Statement analyze nahi ho paya. Please PDF/Excel/CSV format check karo.",
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const handleDownload = () => {
    const rows = displayTransactions.map((item) => ({
      Date: item.date,
      Description: item.description,
      Category: item.category,
      "Debit Amount": getDebitAmount(item),
      "Credit Amount": getCreditAmount(item),
      Balance: getBalance(item),
    }));

    exportToExcel(
      rows,
      `statement_analysis_${new Date().toISOString().slice(0, 10)}`,
    );
  };

  return (
    <div className="px-6 pb-10 pt-8 sm:px-8 lg:px-10">
      <div className="mb-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Bank Statement Analyzer
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Upload PDF, Excel or CSV statement and analyze debit, credit,
              income and expense automatically using MERN backend.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              placeholder="PDF Password (Optional)"
              value={pdfPassword}
              onChange={(e) => setPdfPassword(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500 min-w-[200px]"
            />

            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 select-none">
              <Upload size={18} />
              {loading ? "Analyzing..." : "Upload Statement"}
              <input
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {fileName && (
          <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
            Selected File: {fileName}
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Total Credit
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {formatINR(displaySummary.totalCredit)}
              </h2>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <ArrowUpRight size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Total Debit
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {formatINR(displaySummary.totalDebit)}
              </h2>
            </div>

            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <ArrowDownRight size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Total Transactions
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {displaySummary.totalTransactions}
              </h2>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-slate-700">
              <ListChecks size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Final Balance
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {formatINR(displaySummary.finalBalance)}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Wallet size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <FileText className="h-5 w-5 text-orange-600" />
              Statement Summary Chart
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Credit vs debit comparison
            </p>
          </div>

          {displayTransactions.length > 0 && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 transition hover:bg-orange-100"
            >
              <Download size={17} />
              Download
            </button>
          )}
        </div>

        <div className="h-80">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-orange-100 bg-orange-50/50 text-center">
              <Upload className="mb-3 h-10 w-10 animate-bounce text-orange-500" />
              <p className="text-sm font-bold text-slate-900">
                Analyzing statement...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Text PDF fast analyze hoga, scanned PDF OCR me thoda time
                lagega.
              </p>
            </div>
          ) : displayTransactions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <Upload className="mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-bold text-slate-900">
                Upload your bank statement
              </p>
              <p className="mt-1 text-sm text-slate-500">
                PDF, Excel and CSV files are supported.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(value) => formatINR(value)}
                />

                <Tooltip formatter={(value) => formatINR(value)} />

                <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={70}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {displayTransactions.length > 0 && (
        <div className="mt-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Analyzed Transactions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Auto-detected debit, credit and categories from your statement.
              </p>
            </div>

            <p className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
              Net Flow: {formatINR(displaySummary.netFlow)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Debit Amount</th>
                  <th className="px-4 py-3 text-right">Credit Amount</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>

              <tbody>
                {displayTransactions.map((item) => {
                  const debitAmount = getDebitAmount(item);
                  const creditAmount = getCreditAmount(item);
                  const balance = getBalance(item);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-slate-600">{item.date}</td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.description}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {item.category}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-orange-600">
                        {debitAmount > 0 ? formatINR(debitAmount) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {creditAmount > 0 ? formatINR(creditAmount) : "-"}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-950">
                        {balance > 0 ? formatINR(balance) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementAnalyzer;
