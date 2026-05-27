import incomeModel from "../models/incomeModel.js";
import XLSX from "xlsx";

const demoIncomes = [];

const isMongoConnected = () => incomeModel.db.readyState === 1;

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
  XLSX.utils.book_append_sheet(workbook, sheet, "Income");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const addIncome = async (req, res) => {
  try {
    const { description, amount, category, date, userId, clientId } = req.body;
    if (!isMongoConnected()) {
      const income = {
        _id: Date.now().toString(),
        description,
        amount: Number(amount),
        category,
        date: date || new Date().toISOString(),
        userId,
        clientId,
        type: "income",
        createdAt: new Date().toISOString(),
      };
      demoIncomes.unshift(income);
      return res.json({ success: true, message: "Income added successfully", data: income });
    }

    const newIncome = new incomeModel({ description, amount, category, date, userId, clientId });
    await newIncome.save();
    res.json({ success: true, message: "Income added successfully", data: newIncome });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getIncomes = async (req, res) => {
  try {
    const userId = req.query.userId || (req.body && req.body.userId);
    if (!isMongoConnected()) {
      return res.json({ success: true, data: demoIncomes });
    }

    const query = userId ? { userId } : {};
    const incomes = await incomeModel.find(query).sort({ date: -1 });
    res.json({ success: true, data: incomes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoConnected()) {
      const index = demoIncomes.findIndex((income) => income._id === id);
      if (index === -1) return res.status(404).json({ success: false, message: "Income not found" });
      demoIncomes[index] = { ...demoIncomes[index], ...req.body, amount: Number(req.body.amount) };
      return res.json({ success: true, message: "Income updated successfully", data: demoIncomes[index] });
    }

    const updatedIncome = await incomeModel.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, message: "Income updated successfully", data: updatedIncome });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isMongoConnected()) {
      const index = demoIncomes.findIndex((income) => income._id === id);
      if (index !== -1) demoIncomes.splice(index, 1);
      return res.json({ success: true, message: "Income deleted successfully" });
    }

    await incomeModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Income deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getIncomeOverview = async (req, res) => {
    try {
      const userId = req.query.userId || (req.body && req.body.userId);
      const { range } = req.query;
      const start = getRangeStart(range);
      const end = new Date();
      const query = userId ? { userId, date: { $gte: start, $lte: end } } : { date: { $gte: start, $lte: end } };
      const income = isMongoConnected()
        ? await incomeModel.find(query).sort({ date: -1 })
        : demoIncomes.filter((item) => {
            const itemDate = new Date(item.date);
            return itemDate >= start && itemDate <= end;
          });
  
      const totalIncome = income.reduce((acc, cur) => acc + cur.amount, 0);
      const averageIncome = income.length > 0 ? totalIncome / income.length : 0;
  
      res.json({
        success: true,
        data: {
          totalIncome,
          averageIncome,
          numberOfTransactions: income.length,
          recentTransactions: income.slice(0, 5),
          range
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

export const downloadIncomeExcel = async (req, res) => {
  try {
    const { userId } = req.body || {};
    const query = userId ? { userId } : {};
    const incomes = isMongoConnected()
      ? await incomeModel.find(query).sort({ date: -1 })
      : demoIncomes;

    const rows = incomes.map((income) => ({
      Date: new Date(income.date).toLocaleDateString(),
      Description: income.description,
      Category: income.category,
      Amount: income.amount,
    }));

    const buffer = toExcelBuffer(rows);
    res.setHeader("Content-Disposition", "attachment; filename=income_details.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
