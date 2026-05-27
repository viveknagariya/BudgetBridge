import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";

export const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.body;
    const { range } = req.query;

    const start = new Date();
    if (range === "monthly") {
      start.setDate(1);
    } else if (range === "yearly") {
      start.setMonth(0, 1);
    } else if (range === "weekly") {
      start.setDate(start.getDate() - 7);
    } else {
      start.setHours(0, 0, 0, 0);
    }

    const end = new Date();

    const [income, expense] = await Promise.all([
      incomeModel.find({ userId, date: { $gte: start, $lte: end } }),
      expenseModel.find({ userId, date: { $gte: start, $lte: end } }),
    ]);

    const totalIncome = income.reduce((acc, cur) => acc + cur.amount, 0);
    const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);

    const expenseDistribution = Object.entries(
      expense.reduce((acc, cur) => {
        acc[cur.category] = (acc[cur.category] || 0) + cur.amount;
        return acc;
      }, {})
    ).map(([category, amount]) => ({ category, amount }));

    const recentTransactions = [...income, ...expense]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        monthlyIncome: totalIncome,
        monthlyExpense: totalExpense,
        savings: totalIncome - totalExpense,
        expenseDistribution,
        recentTransactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};