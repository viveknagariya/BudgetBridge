import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  IndianRupee,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TransactionItem from "../components/TransactionItem";
import TimeFrameSelector from "../components/TimeFrame";
import { getTimeFrameRange, generateChartPoints } from "../components/Helpers";
import { CATEGORY_ICONS, CATEGORY_ICONS_Inc } from "../assets/color";
import { formatINR } from "../utils/currency";
import { getSessionUser } from "../utils/authStorage";

const fallbackTransactions = [
  {
    id: "income-demo-1",
    type: "income",
    description: "Monthly Salary",
    amount: 52000,
    category: "Salary",
    date: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "expense-demo-1",
    type: "expense",
    description: "Rent Payment",
    amount: 14500,
    category: "Housing",
    date: "2026-04-02T12:30:00.000Z",
  },
  {
    id: "expense-demo-2",
    type: "expense",
    description: "Big Bazaar Groceries",
    amount: 2850,
    category: "Food",
    date: "2026-04-04T14:15:00.000Z",
  },
  {
    id: "income-demo-2",
    type: "income",
    description: "Freelance Website",
    amount: 12000,
    category: "Freelance",
    date: "2026-04-06T09:45:00.000Z",
  },
  {
    id: "expense-demo-3",
    type: "expense",
    description: "Metro Card Recharge",
    amount: 900,
    category: "Transport",
    date: "2026-04-08T08:20:00.000Z",
  },
  {
    id: "expense-demo-4",
    type: "expense",
    description: "Electricity Bill",
    amount: 2140,
    category: "Utilities",
    date: "2026-04-10T18:10:00.000Z",
  },
];

const expensePalette = [
  "#EF4444",
  "#F59E0B",
  "#2563EB",
  "#10B981",
  "#1E40AF",
  "#64748B",
];

const StatCard = ({ title, value, helper, icon, tone }) => {
  const tones = {
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-sky-50 text-sky-600 border-sky-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>

        <div className={`rounded-xl border p-3 ${tones[tone]}`}>{icon}</div>
      </div>

      <p className="mt-4 text-sm text-slate-500">{helper}</p>
    </div>
  );
};

const readStoredUsername = () => {
  return getSessionUser().name;
};

const Dashboard = () => {
  const [username] = useState(readStoredUsername);

  const outlet = useOutletContext() || {};
  const {
    transactions = fallbackTransactions,
    timeFrame = "monthly",
    setTimeFrame = () => {},
  } = outlet;

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions],
  );

  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame, null),
    [timeFrame],
  );

  const visibleTransactions = useMemo(() => {
    const start = new Date(timeFrameRange.start);
    const end = new Date(timeFrameRange.end);
    end.setHours(23, 59, 59, 999);

    return sortedTransactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date >= start && date <= end;
    });
  }, [sortedTransactions, timeFrameRange]);

  const totals = useMemo(() => {
    return visibleTransactions.reduce(
      (sum, transaction) => {
        const amount = Math.round(Number(transaction.amount || 0));

        if (transaction.type === "income") {
          sum.income += amount;
        }

        if (transaction.type === "expense") {
          sum.expense += amount;
        }

        return sum;
      },
      { income: 0, expense: 0 },
    );
  }, [visibleTransactions]);

  const balance = totals.income - totals.expense;

  const savingsRate = totals.income
    ? Math.max(0, Math.round((balance / totals.income) * 100))
    : 0;

  const chartData = useMemo(() => {
    const points = generateChartPoints(timeFrame, timeFrameRange).map(
      (point) => ({
        ...point,
        income: 0,
        expense: 0,
      }),
    );

    visibleTransactions.forEach((transaction) => {
      const transDate = new Date(transaction.date);

      const point = points.find((item) =>
        timeFrame === "daily"
          ? item.hour === transDate.getHours()
          : timeFrame === "yearly"
            ? item.date.getMonth() === transDate.getMonth()
            : item.date.getDate() === transDate.getDate() &&
              item.date.getMonth() === transDate.getMonth(),
      );

      if (point) {
        point[transaction.type] += Math.round(Number(transaction.amount || 0));
      }
    });

    return points;
  }, [timeFrame, timeFrameRange, visibleTransactions]);

  const categoryData = useMemo(() => {
    const grouped = visibleTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => {
        const category = transaction.category || "Other";
        sum[category] =
          (sum[category] || 0) + Math.round(Number(transaction.amount || 0));
        return sum;
      }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [visibleTransactions]);

  return (
    <div className="px-6 pb-10 pt-8 sm:px-8 lg:px-10">
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Welcome back, {username}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your expense tracker dashboard is ready with your latest financial
            data.{" "}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={setTimeFrame}
            options={["daily", "weekly", "monthly", "yearly"]}
            color="teal"
          />

          <Link
            to="/app/expense"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus size={18} />
            Add Transaction
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={formatINR(balance)}
          helper={`${savingsRate}% saving rate`}
          tone={balance >= 0 ? "blue" : "orange"}
          icon={<Wallet size={22} />}
        />

        <StatCard
          title="Total Income"
          value={formatINR(totals.income)}
          helper={`${
            visibleTransactions.filter((item) => item.type === "income").length
          } income records`}
          tone="green"
          icon={<ArrowUpRight size={22} />}
        />

        <StatCard
          title="Total Expenses"
          value={formatINR(totals.expense)}
          helper={`${
            visibleTransactions.filter((item) => item.type === "expense").length
          } expense records`}
          tone="orange"
          icon={<ArrowDownRight size={22} />}
        />

        <StatCard
          title="Transactions"
          value={visibleTransactions.length}
          helper="Income and expense entries"
          tone="slate"
          icon={<IndianRupee size={22} />}
        />
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Financial Overview
              </h2>
              <p className="text-sm text-slate-500">Income vs expenses trend</p>
            </div>

            <TrendingUp className="text-teal-600" size={22} />
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                  </linearGradient>

                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#f1f5f9"
                  strokeDasharray="3 3"
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
                  tickFormatter={(value) => formatINR(value)}
                  width={78}
                />

                <Tooltip
                  formatter={(value, name) => [
                    formatINR(value),
                    name === "income" ? "Income" : "Expense",
                  ]}
                />

                <Legend />

                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  fill="url(#incomeFill)"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#EF4444"
                  fill="url(#expenseFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-950">
              Expense Categories
            </h2>
            <p className="text-sm text-slate-500">Where the money is going</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={expensePalette[index % expensePalette.length]}
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => formatINR(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {categoryData.slice(0, 5).map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        expensePalette[index % expensePalette.length],
                    }}
                  />
                  {item.name}
                </span>

                <span className="font-semibold text-slate-900">
                  {formatINR(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Recent Transactions
              </h2>
              <p className="text-sm text-slate-500">
                Latest activity from your account
              </p>
            </div>

            <Link
              to="/app/expense"
              className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 hover:text-teal-800"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {sortedTransactions.slice(0, 10).map((transaction) => (
              <TransactionItem
                key={transaction.id || transaction._id}
                transaction={transaction}
                type={transaction.type}
                categoryIcons={
                  transaction.type === "income"
                    ? CATEGORY_ICONS_Inc
                    : CATEGORY_ICONS
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
