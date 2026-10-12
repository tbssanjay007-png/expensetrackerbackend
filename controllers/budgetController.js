const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const Notification = require("../models/Notification");

// GET USER BUDGETS (with actual calculated spending)
const getUserBudgets = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month } = req.query; // optional filter

    const query = { userId };
    if (month) query.month = month;

    const budgets = await Budget.find(query).sort({ createdAt: -1 });

    // Fetch user expenses to calculate spent amounts
    const expenses = await Expense.find({ userId });

    const enrichedBudgets = budgets.map((budget) => {
      // Filter expenses for this budget category and month
      const categoryExpenses = expenses.filter((exp) => {
        const matchesCategory =
          exp.category?.toLowerCase().trim() === budget.category.toLowerCase().trim() ||
          budget.category === "All Categories";

        let matchesMonth = true;
        if (budget.month && exp.date) {
          const expDate = new Date(exp.date);
          const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`;
          matchesMonth = expMonth === budget.month;
        }

        return matchesCategory && matchesMonth;
      });

      const spent = categoryExpenses.reduce(
        (sum, exp) => sum + Number(exp.amount || 0),
        0
      );

      const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      let status = "safe";
      if (percent >= 100) status = "exceeded";
      else if (percent >= (budget.alertThreshold || 80)) status = "warning";

      return {
        ...budget.toObject(),
        spent,
        remaining: Math.max(budget.amount - spent, 0),
        percentage: percent,
        status,
      };
    });

    res.json({ budgets: enrichedBudgets });
  } catch (error) {
    console.error("Get User Budgets Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL BUDGETS (ADMIN)
const getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ budgets });
  } catch (error) {
    console.error("Get All Budgets Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// CREATE / SET BUDGET
const setBudget = async (req, res) => {
  try {
    const { userId, category, amount, month, year, alertThreshold } = req.body;

    if (!userId || !category || amount === undefined || !month) {
      return res.status(400).json({ message: "userId, category, amount, and month are required" });
    }

    let budget = await Budget.findOne({ userId, category, month });

    if (budget) {
      budget.amount = Number(amount);
      if (alertThreshold !== undefined) budget.alertThreshold = Number(alertThreshold);
      if (year) budget.year = Number(year);
      await budget.save();
    } else {
      budget = await Budget.create({
        userId,
        category: category.trim(),
        amount: Number(amount),
        month: month.trim(),
        year: year ? Number(year) : new Date().getFullYear(),
        alertThreshold: alertThreshold !== undefined ? Number(alertThreshold) : 80,
      });
    }

    res.status(200).json({ message: "Budget saved successfully", budget });
  } catch (error) {
    console.error("Set Budget Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE BUDGET
const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ message: "Budget updated successfully", budget });
  } catch (error) {
    console.error("Update Budget Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE BUDGET
const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findByIdAndDelete(id);

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    res.json({ message: "Budget deleted successfully" });
  } catch (error) {
    console.error("Delete Budget Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUserBudgets,
  getAllBudgets,
  setBudget,
  updateBudget,
  deleteBudget,
};
