const Expense = require("../models/Expense");

// GET all expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

// ADD expense
const addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    const expense = new Expense({
      title,
      amount,
      category,
      date,
      description,
    });

    const savedExpense = await expense.save();

    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add expense",
      error: error.message,
    });
  }
};

// DELETE expense
const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete expense",
      error: error.message,
    });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  deleteExpense,
};
