import { useState, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Plus,
  IndianRupee,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Filter,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import axios from "axios";
import { apiUrl } from "../utils/api";
import { exportToExcel } from "../utils/exportUtils";
import AddTransactionModal from "../components/Add";
import TransactionItem from "../components/TransactionItem";
import TimeFrameSelector from "../components/TimeFrame";
import FinancialCard from "../components/FinancialCard";
import { getTimeFrameRange, generateChartPoints } from "../components/Helpers";
import { INCOME_COLORS, CATEGORY_ICONS_Inc } from "../assets/color";
import { incomeStyles as styles } from "../assets/dummyStyles";
import { formatINR } from "../utils/currency";

const INCOME_CATEGORIES = ["Salary", "Interest", "Bonus", "Other"];

function toIsoWithClientTime(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const hhmmss = now.toTimeString().slice(0, 8);
    const combined = new Date(`${dateValue}T${hhmmss}`);
    return combined.toISOString();
  }

  try {
    return new Date(dateValue).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

const IncomeChart = ({ chartData, timeFrame, timeFrameRange }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
          <BarChart2 className="h-5 w-5 text-teal-600 md:h-6 md:w-6" />
          {timeFrame === "daily"
            ? "Hourly"
            : timeFrame === "yearly"
              ? "Monthly"
              : "Daily"}{" "}
          Income Trends
        </h3>

        <p className="mt-1 text-sm font-medium text-slate-500">
          {timeFrameRange.label}
        </p>
      </div>
    </div>

    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
        >
          <defs>
            <linearGradient id="incomeBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            width={75}
            tickFormatter={(value) => formatINR(value)}
          />

          <Tooltip
            formatter={(value) => [formatINR(value), "Income"]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
            }}
          />

          <Bar
            dataKey="income"
            name="Income"
            radius={[8, 8, 0, 0]}
            barSize={22}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={INCOME_COLORS[index % INCOME_COLORS.length]}
              />
            ))}
          </Bar>

          {chartData.map(
            (point, index) =>
              point.isCurrent && (
                <ReferenceLine
                  key={index}
                  x={point.label}
                  stroke="#0f766e"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              ),
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const FilterSection = ({ filter, setFilter, handleDownload }) => (
  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
    <div className="relative w-full sm:w-52">
      <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 hover:border-teal-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
      >
        <option value="all">All Categories</option>
        <option value="Salary">Salary</option>
        <option value="Interest">Interest</option>
        <option value="Bonus">Bonus</option>
        <option value="Other">Other</option>
      </select>

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
        ▼
      </span>
    </div>

    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-bold text-teal-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-100 hover:text-teal-800 hover:shadow-md"
    >
      <Download size={17} />
      Download
    </button>
  </div>
);

const IncomePage = () => {
  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    refreshTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "income",
    category: "Salary",
  });

  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    category: "Salary",
    date: new Date().toISOString().split("T")[0],
  });

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame, null),
    [timeFrame],
  );

  const chartPoints = useMemo(
    () => generateChartPoints(timeFrame, timeFrameRange),
    [timeFrame, timeFrameRange],
  );

  const isDateInRange = useCallback((date, start, end) => {
    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);

    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactionDate >= startDate && transactionDate <= endDate;
  }, []);

  const incomeTransactions = useMemo(
    () =>
      (outletTransactions || [])
        .filter((t) => t.type === "income")
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [outletTransactions],
  );

  const timeFrameTransactions = useMemo(
    () =>
      incomeTransactions.filter((t) =>
        isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end),
      ),
    [incomeTransactions, timeFrameRange, isDateInRange],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return timeFrameTransactions;

    return timeFrameTransactions.filter(
      (t) => (t.category || "").toLowerCase() === filter.toLowerCase(),
    );
  }, [timeFrameTransactions, filter]);

  const chartData = useMemo(() => {
    const data = chartPoints.map((point) => ({ ...point, income: 0 }));

    filteredTransactions.forEach((transaction) => {
      const transDate = new Date(transaction.date);

      const point = data.find((d) =>
        timeFrame === "daily"
          ? d.hour === transDate.getHours()
          : timeFrame === "yearly"
            ? d.date.getMonth() === transDate.getMonth()
            : d.date.getDate() === transDate.getDate() &&
              d.date.getMonth() === transDate.getMonth(),
      );

      if (point) {
        point.income += Math.round(Number(transaction.amount));
      }
    });

    return data;
  }, [filteredTransactions, chartPoints, timeFrame]);

  const totalIncome = useMemo(
    () =>
      filteredTransactions.reduce(
        (sum, t) => sum + Math.round(Number(t.amount || 0)),
        0,
      ),
    [filteredTransactions],
  );

  const averageIncome = useMemo(
    () =>
      filteredTransactions.length
        ? Math.round(totalIncome / filteredTransactions.length)
        : 0,
    [totalIncome, filteredTransactions.length],
  );

  const transactionsCount = filteredTransactions.length;

  const handleAddTransaction = useCallback(async () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    try {
      setLoading(true);

      const payload = {
        description: newTransaction.description.trim(),
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        type: "income",
        date: toIsoWithClientTime(newTransaction.date),
      };

      await addTransaction(payload);
      await refreshTransactions();

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "income",
        category: "Salary",
      });

      setShowModal(false);
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      alert(serverMsg || "Server error while adding income.");
    } finally {
      setLoading(false);
    }
  }, [newTransaction, addTransaction, refreshTransactions]);

  const handleEditTransaction = useCallback(async () => {
    if (!editingId || !editForm.description || !editForm.amount) return;

    try {
      setLoading(true);

      const payload = {
        description: editForm.description.trim(),
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        type: "income",
        date: toIsoWithClientTime(editForm.date),
      };

      await updateTransaction(editingId, payload);
      await refreshTransactions();

      setEditingId(null);
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      alert(serverMsg || "Server error while updating income.");
    } finally {
      setLoading(false);
    }
  }, [editingId, editForm, updateTransaction, refreshTransactions]);

  const handleDeleteTransaction = useCallback(
    async (id) => {
      if (!id) return;
      if (!window.confirm("Are you sure you want to delete this income?")) {
        return;
      }

      try {
        setLoading(true);
        await deleteTransaction(id);
        await refreshTransactions();
      } catch (err) {
        const serverMsg = err?.response?.data?.message;
        alert(serverMsg || "Server error while deleting income.");
      } finally {
        setLoading(false);
      }
    },
    [deleteTransaction, refreshTransactions],
  );

  const handleDownload = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/income/downloadExcel"), {
        headers: getAuthHeaders(),
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      const disposition = res.headers["content-disposition"];
      let filename = "income_details.xlsx";

      if (disposition) {
        const match = disposition.match(/filename="?(.+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      try {
        const exportData = filteredTransactions.map((t) => ({
          Date: new Date(t.date).toLocaleDateString(),
          Description: t.description,
          Category: t.category,
          Amount: t.amount,
          Type: "Income",
        }));

        exportToExcel(
          exportData,
          `income_${new Date().toISOString().slice(0, 10)}`,
        );
      } catch {
        alert("Failed to download data.");
      }
    }
  }, [getAuthHeaders, filteredTransactions]);

  return (
    <div className="px-6 pb-10 pt-8 sm:px-8 lg:px-10">
      <div className="mb-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Income Overview
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Track and manage your income sources
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            <Plus size={18} />
            {loading ? "Processing..." : "Add Income"}
          </button>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Select report period
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              View income data by daily, weekly, monthly or yearly range
            </p>
          </div>

          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={setTimeFrame}
            options={["daily", "weekly", "monthly", "yearly"]}
            color="teal"
          />
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <FinancialCard
          icon={
            <div className={styles.iconGreen}>
              <IndianRupee
                className={`h-4 w-4 md:h-5 md:w-5 ${styles.textGreen}`}
              />
            </div>
          }
          label="Total Income"
          value={formatINR(totalIncome)}
          additionalContent={
            <div className="mt-2 flex items-center text-xs text-slate-500">
              <Calendar className="mr-1 h-3 w-3" />
              {timeFrameRange.label}
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={styles.iconBlue}>
              <BarChart2
                className={`h-4 w-4 md:h-5 md:w-5 ${styles.textBlue}`}
              />
            </div>
          }
          label="Average Income"
          value={formatINR(averageIncome)}
          additionalContent={
            <div className="mt-2 flex items-center text-xs text-slate-500">
              <Calendar className="mr-1 h-3 w-3" />
              {transactionsCount} transactions
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={styles.iconPurple}>
              <TrendingUp
                className={`h-4 w-4 md:h-5 md:w-5 ${styles.textPurple}`}
              />
            </div>
          }
          label="Transactions"
          value={transactionsCount}
          additionalContent={
            <div className="mt-2 flex items-center text-xs text-slate-500">
              <Calendar className="mr-1 h-3 w-3" />
              {filter === "all" ? "All categories" : filter}
            </div>
          }
        />
      </div>

      <div className="mt-7">
        <IncomeChart
          chartData={chartData}
          timeFrame={timeFrame}
          timeFrameRange={timeFrameRange}
        />
      </div>

      <div className="mt-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <IndianRupee className="h-5 w-5 text-teal-600 md:h-6 md:w-6" />
              Income Transactions
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              {timeFrameRange.label}
            </p>
          </div>

          <FilterSection
            filter={filter}
            setFilter={setFilter}
            handleDownload={handleDownload}
          />
        </div>

        <div className={styles.transactionList}>
          {filteredTransactions
            .slice(0, showAll ? filteredTransactions.length : 8)
            .map((transaction) => (
              <TransactionItem
                key={transaction.id || transaction._id}
                transaction={transaction}
                isEditing={editingId === (transaction.id || transaction._id)}
                editForm={editForm}
                setEditForm={setEditForm}
                onSave={handleEditTransaction}
                onCancel={() => setEditingId(null)}
                onDelete={handleDeleteTransaction}
                type="income"
                categoryIcons={CATEGORY_ICONS_Inc}
                setEditingId={setEditingId}
              />
            ))}

          {!showAll && filteredTransactions.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-700 transition hover:bg-teal-100 hover:text-teal-800"
            >
              <Eye size={18} />
              View All {filteredTransactions.length} Transactions
            </button>
          )}

          {filteredTransactions.length === 0 && (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIcon}>
                <IndianRupee className="h-6 w-6 text-teal-400 md:h-8 md:w-8" />
              </div>

              <p className={styles.emptyStateText}>
                No income transactions found
              </p>

              <p className={styles.emptyStateSubtext}>
                {filter === "all"
                  ? "You haven't recorded any income yet"
                  : `No ${filter} transactions found`}
              </p>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700"
              >
                <Plus size={16} />
                Add Income
              </button>
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal
        showModal={showModal}
        setShowModal={setShowModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction}
        loading={loading}
        type="income"
        title="Add New Income"
        buttonText="Add Income"
        categories={INCOME_CATEGORIES}
        color="teal"
      />
    </div>
  );
};

export default IncomePage;
