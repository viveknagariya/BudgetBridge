import React, { useState, useMemo, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Plus,
  IndianRupee,
  Download,
  Eye,
  Calendar,
  TrendingDown,
  Filter,
  BarChart2,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import axios from "axios";
import { apiUrl } from "../utils/api";
import { exportToExcel } from "../utils/exportUtils";
import FinancialCard from "../components/FinancialCard";
import TimeFrameSelector from "../components/TimeFrame";
import TransactionItem from "../components/TransactionItem";
import AddTransactionModal from "../components/Add";
import { getTimeFrameRange, generateChartPoints } from "../components/Helpers";
import { CATEGORY_ICONS } from "../assets/color";
import { formatINR } from "../utils/currency";

const EXPENSE_CATEGORIES = [
  "Food",
  "Housing",
  "Transport",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Education",
  "Other",
];

const CATEGORY_KEYWORDS = {
  Food: [
    "apple", "apples", "banana", "bananas", "mango", "mangoes", "orange", "oranges", "grapes", "grape", "watermelon", "melon", "muskmelon", "papaya", "pineapple", "pomegranate", "anar", "guava", "jamfal", "chikoo", "sapota", "kiwi", "strawberry", "blueberry", "raspberry", "blackberry", "pear", "nashpati", "peach", "plum", "dragon fruit", "custard apple", "sitafal", "lychee", "litchi", "coconut", "nariyal", "lemon", "lime", "mosambi", "sweet lime", "fig", "anjeer", "dates", "khajur", "dry dates", "fruit", "fruits", "fruit basket", "fruit juice", "fresh fruit",
    "potato", "potatoes", "aloo", "onion", "onions", "pyaz", "tomato", "tomatoes", "chilli", "chili", "green chilli", "mirchi", "garlic", "lahsun", "ginger", "adrak", "coriander", "dhaniya", "mint", "pudina", "spinach", "palak", "fenugreek", "methi", "cabbage", "patta gobi", "cauliflower", "gobi", "brinjal", "baingan", "lady finger", "okra", "bhindi", "bitter gourd", "karela", "bottle gourd", "lauki", "ridge gourd", "turai", "capsicum", "bell pepper", "carrot", "gajar", "beetroot", "radish", "mooli", "cucumber", "kakdi", "beans", "green peas", "matar", "pumpkin", "kaddu", "sweet potato", "shakarkand", "corn", "makai", "mushroom", "broccoli", "lettuce", "spring onion", "drumstick", "sargavo", "vegetable", "vegetables", "sabji", "sabzi", "green vegetables", "fresh vegetables",
    "grocery", "groceries", "ration", "kirana", "rice", "chawal", "basmati", "wheat", "atta", "flour", "maida", "besan", "rava", "suji", "poha", "sabudana", "dalia", "oats", "corn flour", "dal", "daal", "lentils", "toor dal", "moong dal", "masoor dal", "chana dal", "urad dal", "rajma", "chole", "chickpeas", "kabuli chana", "soybean", "sugar", "chini", "jaggery", "gud", "salt", "namak", "rock salt", "black salt", "oil", "cooking oil", "sunflower oil", "groundnut oil", "mustard oil", "olive oil", "ghee", "vanaspati", "tea", "chai", "tea powder", "coffee", "coffee powder", "milk powder", "corn flakes", "breakfast cereal", "noodles", "maggi", "pasta", "vermicelli", "sevai", "bread", "bun", "toast", "jam", "honey", "peanut butter", "sauce", "ketchup", "vinegar", "mayonnaise", "pickle", "achar", "papad", "khakhra", "namkeen", "snacks", "biscuit", "biscuits", "cookies", "wafer", "chips", "dry fruits", "almond", "badam", "cashew", "kaju", "raisin", "kishmish", "pista", "walnut", "akhrot", "makhana", "spices", "masala", "turmeric", "haldi", "red chilli powder", "mirchi powder", "coriander powder", "dhaniya powder", "cumin", "jeera", "mustard seeds", "rai", "ajwain", "hing", "asafoetida", "garam masala", "chaat masala", "sambar masala", "pav bhaji masala", "biryani masala", "black pepper", "pepper", "elaichi", "cardamom", "clove", "laung", "cinnamon", "dalchini", "bay leaf", "tej patta", "ration shop", "monthly grocery", "monthly ration",
    "milk", "dudh", "curd", "dahi", "buttermilk", "chaas", "paneer", "cheese", "butter", "cream", "malai", "lassi", "yogurt", "milk packet", "amul milk", "amul", "dairy", "dairy product", "dairy products", "milkman",
    "egg", "eggs", "anda", "chicken", "mutton", "fish", "prawns", "seafood", "meat", "non veg", "non-veg", "omelette", "boiled egg",
    "restaurant", "hotel food", "outside food", "dinner", "lunch", "breakfast", "cafe", "coffee shop", "swiggy", "zomato", "dominos", "pizza", "burger", "sandwich", "vada pav", "dabeli", "pani puri", "street food", "chaat", "ice cream", "cake", "pastry", "cold drink", "soft drink", "juice shop", "tea stall", "chai tapri", "food delivery", "takeaway", "parcel food"
  ],
  Housing: [
    "rent", "house rent", "room rent", "flat rent", "pg rent", "hostel rent", "deposit", "security deposit", "brokerage", "home loan", "emi", "home emi", "furniture", "sofa", "bed", "mattress", "pillow", "bedsheet", "curtain", "doormat", "carpet", "chair", "table", "wardrobe", "almirah", "fan", "bulb", "tube light", "led bulb", "extension board", "switch", "home repair", "plumber", "electrician", "carpenter", "painting", "wall paint", "home decor", "repair", "maintenance", "home maintenance",
    "dishwash", "dish wash", "dishwash bar", "dish wash bar", "dishwash liquid", "vim", "pril", "soap bar", "detergent", "washing powder", "washing liquid", "surf excel", "tide", "rin", "fabric softener", "comfort", "floor cleaner", "phenyl", "lizol", "harpic", "toilet cleaner", "bathroom cleaner", "kitchen cleaner", "glass cleaner", "colin", "bleach", "disinfectant", "broom", "jhadu", "mop", "pocha", "bucket", "dustbin", "garbage bag", "trash bag", "tissue paper", "toilet paper", "paper towel", "napkin", "scrub", "scrubber", "sponge", "cleaning brush", "toilet brush", "room freshener", "air freshener", "agarbatti", "incense stick", "matchbox", "lighter", "mosquito coil", "mosquito liquid", "good night", "all out", "hit spray", "cockroach spray", "pest control", "cleaning", "house cleaning", "household item", "household items"
  ],
  Transport: [
    "bus", "brts", "metro", "train", "railway", "auto", "rickshaw", "taxi", "cab", "ola", "uber", "rapido", "petrol", "diesel", "fuel", "cng", "parking", "toll", "fastag", "vehicle service", "bike service", "car service", "puncture", "tyre", "helmet", "bus pass", "train ticket", "flight ticket", "air ticket", "travel", "trip", "hotel booking", "luggage", "suitcase"
  ],
  Shopping: [
    "shirt", "tshirt", "t-shirt", "jeans", "pant", "trouser", "kurta", "kurti", "saree", "dress", "jacket", "sweater", "hoodie", "innerwear", "undergarments", "socks", "cap", "belt", "wallet", "shoes", "slippers", "sandals", "footwear", "laundry", "dry cleaning", "tailor", "stitching", "clothes", "clothing",
    "mobile", "phone", "smartphone", "laptop", "computer", "keyboard", "mouse", "charger", "cable", "usb cable", "power bank", "earphones", "headphones", "speaker", "bluetooth", "adapter", "pendrive", "hard disk", "ssd", "memory card", "router", "wifi router", "monitor", "printer", "cartridge", "electronics", "gadget", "gadgets", "mobile cover", "screen guard", "tempered glass", "repair mobile", "laptop repair",
    "soap", "body soap", "bathing soap", "shampoo", "conditioner", "hair oil", "toothpaste", "tooth brush", "toothbrush", "mouthwash", "face wash", "facewash", "cream", "moisturizer", "lotion", "sunscreen", "lip balm", "deodorant", "perfume", "body spray", "talcum powder", "powder", "comb", "hair gel", "hair wax", "razor", "shaving cream", "after shave", "trimmer", "sanitary pad", "sanitary pads", "tampon", "menstrual cup", "diaper", "baby diaper", "wet wipes", "cotton buds", "nail cutter", "handwash", "hand wash", "sanitizer", "personal care", "skin care", "hair care"
  ],
  Entertainment: [
    "movie", "cinema", "pvr", "inox", "ticket", "concert", "game", "gaming", "playstation", "xbox", "outing", "picnic", "amusement", "fun", "club", "sports", "cricket", "football", "badminton", "gym", "fitness"
  ],
  Utilities: [
    "electricity", "electricity bill", "light bill", "bijli bill", "gas bill", "pipeline gas", "png gas", "lpg", "gas cylinder", "cylinder", "water bill", "pani bill", "internet bill", "wifi bill", "broadband", "fiber bill", "mobile bill", "postpaid bill", "landline bill", "dth bill", "cable bill", "tv bill", "maintenance bill", "society maintenance", "property tax", "house tax", "municipal tax", "bill", "bills", "utility", "utilities",
    "recharge", "mobile recharge", "phone recharge", "jio recharge", "airtel recharge", "vi recharge", "vodafone recharge", "bsnl recharge", "data pack", "internet pack", "top up", "dth recharge", "tataplay", "tata play", "dish tv", "sun direct", "netflix", "amazon prime", "prime video", "hotstar", "disney hotstar", "zee5", "sonyliv", "youtube premium", "spotify", "gaana", "jiosaavn", "subscription", "subscriptions", "ott", "app subscription", "software subscription", "domain renewal", "hosting renewal"
  ],
  Healthcare: [
    "medicine", "medicines", "tablet", "capsule", "syrup", "injection", "doctor", "doctor fee", "consultation", "hospital", "clinic", "medical", "pharmacy", "chemist", "lab test", "blood test", "x ray", "x-ray", "scan", "mri", "ct scan", "health checkup", "first aid", "bandage", "cotton", "dettol", "savlon", "painkiller", "paracetamol", "crocin", "dolo", "antibiotic", "eye drops", "health insurance", "medical insurance", "mask", "thermometer", "bp machine", "glucose meter", "health"
  ],
  Education: [
    "school fee", "college fee", "tuition fee", "course fee", "exam fee", "admission fee", "book", "books", "notebook", "register", "pen", "pencil", "eraser", "sharpener", "marker", "highlighter", "file", "folder", "xerox", "photocopy", "printout", "printing", "assignment", "project file", "stationery", "online course", "udemy", "coursera", "certificate", "coaching", "classes", "education"
  ],
  Other: [
    "baby food", "baby powder", "baby soap", "baby shampoo", "toy", "toys", "school bag", "kids dress", "kids shoes", "milk bottle", "baby wipes", "family expense", "kids", "child", "children", "gift", "gifts", "birthday gift", "anniversary gift", "wedding gift", "donation", "charity", "mandir donation", "temple donation", "help", "festival gift", "diwali gift", "rakhi gift", "bank charge", "bank charges", "atm charge", "transaction fee", "upi charge", "loan emi", "credit card bill", "debit card charge", "insurance", "life insurance", "vehicle insurance", "mutual fund", "sip", "investment", "interest", "penalty", "late fee", "finance", "banking", "other", "misc", "miscellaneous", "general", "cash", "unknown", "extra", "small expense", "daily expense"
  ]
};

function detectExpenseCategory(description = "") {
  const text = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "Other";
}

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

const FilterSection = ({ filter, setFilter, handleDownload }) => {
  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
      <div className="relative w-full sm:w-48">
        <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-600" />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all duration-200 hover:border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
        >
          <option value="all">All Transactions</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          ▼
        </span>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 text-sm font-bold text-orange-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-100 hover:text-orange-800 hover:shadow-md"
      >
        <Download size={17} />
        Download
      </button>
    </div>
  );
};

const ExpensePage = () => {
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
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  });

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
  });

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const updateNewTransaction = useCallback((updatedFields) => {
    setNewTransaction((prev) => {
      const next = { ...prev, ...updatedFields };

      if (Object.prototype.hasOwnProperty.call(updatedFields, "description")) {
        next.category = detectExpenseCategory(updatedFields.description);
      }

      return next;
    });
  }, []);

  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame, selectedMonth),
    [timeFrame, selectedMonth],
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

  const expenseTransactions = useMemo(
    () =>
      (outletTransactions || [])
        .filter((t) => t.type === "expense")
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [outletTransactions],
  );

  const timeFrameTransactions = useMemo(
    () =>
      expenseTransactions.filter((t) =>
        isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end),
      ),
    [expenseTransactions, timeFrameRange, isDateInRange],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return timeFrameTransactions;

    const now = new Date();
    const yearFromSelectedMonth = selectedMonth
      ? new Date(selectedMonth).getFullYear()
      : null;
    const monthFromSelectedMonth = selectedMonth
      ? new Date(selectedMonth).getMonth()
      : null;
    const yearFromTimeFrame = timeFrameRange?.start
      ? new Date(timeFrameRange.start).getFullYear()
      : null;
    const monthFromTimeFrame = timeFrameRange?.start
      ? new Date(timeFrameRange.start).getMonth()
      : null;

    return timeFrameTransactions.filter((t) => {
      const transDate = new Date(t.date);

      if (filter === "month") {
        const compareYear =
          yearFromSelectedMonth ?? yearFromTimeFrame ?? now.getFullYear();
        const compareMonth =
          monthFromSelectedMonth ?? monthFromTimeFrame ?? now.getMonth();

        return (
          transDate.getFullYear() === compareYear &&
          transDate.getMonth() === compareMonth
        );
      }

      if (filter === "year") {
        const compareYear =
          yearFromSelectedMonth ?? yearFromTimeFrame ?? now.getFullYear();

        return transDate.getFullYear() === compareYear;
      }

      return true;
    });
  }, [timeFrameTransactions, filter, selectedMonth, timeFrameRange]);

  const totalExpense = useMemo(
    () =>
      filteredTransactions.reduce(
        (sum, t) => sum + Math.round(Number(t.amount || 0)),
        0,
      ),
    [filteredTransactions],
  );

  const averageExpense = useMemo(
    () =>
      filteredTransactions.length
        ? Math.round(totalExpense / filteredTransactions.length)
        : 0,
    [filteredTransactions, totalExpense],
  );

  const chartData = useMemo(() => {
    const data = chartPoints.map((point) => ({ ...point, expense: 0 }));

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
        point.expense += Math.round(Number(transaction.amount));
      }
    });

    return data;
  }, [filteredTransactions, chartPoints, timeFrame]);

  const handleAddTransaction = async () => {
    if (loading) return;
    if (!newTransaction.description || !newTransaction.amount) return;

    try {
      setLoading(true);
      const autoCategory = detectExpenseCategory(newTransaction.description);

      const payload = {
        description: newTransaction.description.trim(),
        amount: parseFloat(newTransaction.amount),
        category: autoCategory,
        type: "expense",
        date: toIsoWithClientTime(newTransaction.date),
      };

      await addTransaction(payload);
      await refreshTransactions();

      const addedDate = new Date(payload.date || newTransaction.date);
      const addedDateInRange =
        addedDate >= timeFrameRange.start && addedDate <= timeFrameRange.end;

      if (!addedDateInRange) {
        setTimeFrame("monthly");
        setSelectedMonth(
          new Date(addedDate.getFullYear(), addedDate.getMonth(), 1),
        );
      }

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
      });

      setShowModal(false);
    } catch {
      alert("Server error while adding expense.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = async () => {
    if (loading) return;
    if (!editingId || !editForm.description || !editForm.amount) return;

    try {
      setLoading(true);
      const payload = {
        description: editForm.description.trim(),
        amount: parseFloat(editForm.amount),
        category:
          editForm.category || detectExpenseCategory(editForm.description),
        type: "expense",
        date: toIsoWithClientTime(editForm.date),
      };

      await updateTransaction(editingId, payload);
      await refreshTransactions();

      setEditingId(null);
    } catch {
      alert("Server error while updating expense.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (loading) return;
    if (!id) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteTransaction(id);
      await refreshTransactions();
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await axios.get(apiUrl("/expense/downloadExcel"), {
        headers: getAuthHeaders(),
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      const disposition = res.headers["content-disposition"];
      let filename = "expense_details.xlsx";

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
          Type: "Expense",
        }));

        exportToExcel(
          exportData,
          `expenses_${new Date().toISOString().slice(0, 10)}`,
        );
      } catch {
        alert("Failed to download data.");
      }
    }
  };

  return (
    <div className="px-6 pb-10 pt-8 sm:px-8 lg:px-10">
      <div className="mb-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Expense Overview
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Track and manage your expenses
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/app/statement-analyzer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-100 hover:text-orange-800 hover:shadow-md"
            >
              <FileText size={18} />
              Add Statement
            </Link>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              <Plus size={18} />
              {loading ? "Processing..." : "Add Expense"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Select report period
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              View expense data by daily, weekly, monthly or yearly range
            </p>
          </div>

          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={(frame) => {
              setTimeFrame(frame);
              setSelectedMonth(null);
            }}
            options={["daily", "weekly", "monthly", "yearly"]}
            color="orange"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <FinancialCard
          icon={
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
              <IndianRupee className="h-5 w-5 text-orange-600" />
            </div>
          }
          label="Total Expenses"
          value={formatINR(totalExpense)}
          additionalContent={
            <div className="mt-2 flex items-center text-xs text-slate-500">
              <Calendar className="mr-1 h-3 w-3" />
              {timeFrameRange.label}
            </div>
          }
          borderColor="border-orange-400"
        />

        <FinancialCard
          icon={
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <BarChart2 className="h-5 w-5 text-amber-600" />
            </div>
          }
          label="Average Expense"
          value={formatINR(averageExpense)}
          additionalContent={
            <div className="mt-2 flex items-center text-xs text-slate-500">
              <Calendar className="mr-1 h-3 w-3" />
              {filteredTransactions.length} transactions
            </div>
          }
          borderColor="border-amber-400"
        />

        <FinancialCard
          icon={
            <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
            </div>
          }
          label="Transactions"
          value={filteredTransactions.length}
          additionalContent={
            <div className="mt-2 flex items-center text-xs text-slate-500">
              <Calendar className="mr-1 h-3 w-3" />
              {filter === "all" ? "All records" : "Filtered records"}
            </div>
          }
          borderColor="border-yellow-400"
        />
      </div>

      <div className="mt-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <BarChart2 className="h-6 w-6 text-orange-500" />
            {timeFrame === "daily"
              ? "Hourly"
              : timeFrame === "yearly"
                ? "Monthly"
                : "Daily"}{" "}
            Expense Trends
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-500">
            {timeFrameRange.label}
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
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
                formatter={(value) => [formatINR(value), "Expense"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
                }}
              />

              <Area
                type="monotone"
                dataKey="expense"
                stroke="#f97316"
                fill="url(#expenseGradient)"
                strokeWidth={2}
                activeDot={{ r: 6, fill: "#f97316" }}
              />

              {chartData.map(
                (point, index) =>
                  point.isCurrent && (
                    <ReferenceLine
                      key={index}
                      x={point.label}
                      stroke="#ea580c"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                  ),
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-950">
              <IndianRupee className="h-6 w-6 text-orange-500" />
              Expense Transactions
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

        <div className="space-y-3">
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
                type="expense"
                categoryIcons={CATEGORY_ICONS}
                setEditingId={setEditingId}
              />
            ))}

          {!showAll && filteredTransactions.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-100 hover:text-orange-800"
            >
              <Eye size={18} />
              View All {filteredTransactions.length} Transactions
            </button>
          )}

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <IndianRupee className="h-8 w-8" />
              </div>

              <p className="text-sm font-bold text-slate-900">
                No expense transactions found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {filter === "all"
                  ? "You haven't recorded any expenses yet"
                  : "No transactions found for this filter"}
              </p>

              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700"
              >
                <Plus size={16} />
                Add Expense
              </button>
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal
        showModal={showModal}
        setShowModal={setShowModal}
        newTransaction={newTransaction}
        setNewTransaction={updateNewTransaction}
        handleAddTransaction={handleAddTransaction}
        loading={loading}
        type="expense"
        title="Add New Expense"
        buttonText="Add Expense"
        categories={EXPENSE_CATEGORIES}
        color="orange"
      />
    </div>
  );
};

export default ExpensePage;
