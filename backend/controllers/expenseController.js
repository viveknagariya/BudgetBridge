import expenseModel from "../models/expenseModel.js";
import XLSX from "xlsx";

const demoExpenses = [];

const isMongoConnected = () => expenseModel.db.readyState === 1;

const getRangeStart = (range) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "monthly") start.setDate(1);
  else if (range === "yearly") start.setMonth(0, 1);
  else if (range === "weekly") start.setDate(start.getDate() - 7);
  return start;
};

const toExcelBuffer = (rows) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Expenses");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const addExpense = async (req, res) => {
  try {
    const { description, amount, category, date, userId, clientId } = req.body;
    if (!isMongoConnected()) {
      const expense = {
        _id: Date.now().toString(),
        description,
        amount: Number(amount),
        category,
        date: date || new Date().toISOString(),
        userId,
        clientId,
        type: "expense",
        createdAt: new Date().toISOString(),
      };
      demoExpenses.unshift(expense);
      return res.json({ success: true, message: "Expense added successfully", data: expense });
    }

    const newExpense = new expenseModel({ description, amount, category, date, userId, clientId });
    await newExpense.save();
    res.json({ success: true, message: "Expense added successfully", data: newExpense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const userId = req.query.userId || (req.body && req.body.userId);
    if (!isMongoConnected()) {
      return res.json({ success: true, data: demoExpenses });
    }

    const query = userId ? { userId } : {};
    const expenses = await expenseModel.find(query).sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoConnected()) {
      const index = demoExpenses.findIndex((expense) => expense._id === id);
      if (index === -1) return res.status(404).json({ success: false, message: "Expense not found" });
      demoExpenses[index] = { ...demoExpenses[index], ...req.body, amount: Number(req.body.amount) };
      return res.json({ success: true, message: "Expense updated successfully", data: demoExpenses[index] });
    }

    const updatedExpense = await expenseModel.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, message: "Expense updated successfully", data: updatedExpense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoConnected()) {
      const index = demoExpenses.findIndex((expense) => expense._id === id);
      if (index !== -1) demoExpenses.splice(index, 1);
      return res.json({ success: true, message: "Expense deleted successfully" });
    }

    await expenseModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExpenseOverview = async (req, res) => {
    try {
      const userId = req.query.userId || (req.body && req.body.userId);
      const { range } = req.query;
      const start = getRangeStart(range);
      const end = new Date();
      const query = userId ? { userId, date: { $gte: start, $lte: end } } : { date: { $gte: start, $lte: end } };
      const expense = isMongoConnected()
        ? await expenseModel.find(query).sort({ date: -1 })
        : demoExpenses.filter((item) => {
            const itemDate = new Date(item.date);
            return itemDate >= start && itemDate <= end;
          });
  
      const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);
      const averageExpense = expense.length > 0 ? totalExpense / expense.length : 0;
  
      res.json({
        success: true,
        data: {
          totalExpense,
          averageExpense,
          numberOfTransactions: expense.length,
          recentTransactions: expense.slice(0, 5),
          range
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

export const downloadExpenseExcel = async (req, res) => {
  try {
    const { userId } = req.body || {};
    const query = userId ? { userId } : {};
    const expenses = isMongoConnected()
      ? await expenseModel.find(query).sort({ date: -1 })
      : demoExpenses;

    const rows = expenses.map((expense) => ({
      Date: new Date(expense.date).toLocaleDateString(),
      Description: expense.description,
      Category: expense.category,
      Amount: expense.amount,
    }));

    const buffer = toExcelBuffer(rows);
    res.setHeader("Content-Disposition", "attachment; filename=expense_details.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
