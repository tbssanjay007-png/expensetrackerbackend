const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Expense = require("../models/Expense");
const User = require("../models/User");
const Budget = require("../models/Budget");
const Notification = require("../models/Notification");

// Helper to recalculate user total expense
const syncUserTotalExpense = async (userId) => {
  try {
    const expenses = await Expense.find({ userId });
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    await User.findByIdAndUpdate(userId, { totalExpense: total });
  } catch (err) {
    console.error("Error syncing user total expense:", err);
  }
};

// Helper to check budget and notify user if needed
const checkBudgetAndNotify = async (userId, category, expenseDate) => {
  try {
    const d = new Date(expenseDate || Date.now());
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    // Find budget for category or all categories
    const budgets = await Budget.find({
      userId,
      month,
      $or: [{ category: category }, { category: "All Categories" }],
    });

    for (const budget of budgets) {
      // Calculate total spent in this budget
      const categoryFilter =
        budget.category === "All Categories" ? {} : { category: budget.category };

      const allCatExpenses = await Expense.find({
        userId,
        ...categoryFilter,
      });

      const monthExpenses = allCatExpenses.filter((e) => {
        const ed = new Date(e.date);
        return `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, "0")}` === month;
      });

      const totalSpent = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const percent = Math.round((totalSpent / budget.amount) * 100);

      if (totalSpent >= budget.amount) {
        await Notification.create({
          userId,
          title: "Budget Exceeded!",
          message: `Alert: You have exceeded your ${budget.category} budget of ₹${budget.amount.toLocaleString("en-IN")}. Current spent: ₹${totalSpent.toLocaleString("en-IN")}.`,
          type: "warning",
        });
      } else if (percent >= (budget.alertThreshold || 80)) {
        await Notification.create({
          userId,
          title: "Budget Warning",
          message: `Warning: You have reached ${percent}% of your ${budget.category} budget (₹${totalSpent.toLocaleString("en-IN")} of ₹${budget.amount.toLocaleString("en-IN")}).`,
          type: "info",
        });
      }
    }
  } catch (err) {
    console.error("Error checking budget notification:", err);
  }
};

// ==================== ADD EXPENSE ====================
router.post("/", async (req, res) => {
  try {
    const userId = String(req.body.userId || "").trim();
    const name = String(req.body.name || req.body.title || "").trim();
    const category = String(req.body.category || "").trim();
    const amount = Number(req.body.amount);
    const { description, date } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "A valid user ID is required",
      });
    }

    if (!category || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({
        message: "Category and a valid amount are required",
      });
    }

    const expense = await Expense.create({
      userId,
      name,
      category,
      amount,
      description: description || "",
      date: date || Date.now(),
    });

    // Update user's cached total expense
    await syncUserTotalExpense(userId);

    // Check budget alert
    await checkBudgetAndNotify(userId, category, expense.date);

    res.status(201).json({
      message: "Expense added successfully",
      expense,
    });
  } catch (error) {
    console.error("Add Expense Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== GET ALL EXPENSES ====================
// ADMIN USE (supports category, search, user filters)
router.get("/", async (req, res) => {
  try {
    const { category, search, userId } = req.query;
    const query = {};

    if (userId && mongoose.isValidObjectId(userId)) {
      query.userId = userId;
    }
    if (category && category !== "All") {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const expenses = await Expense.find(query)
      .populate("userId", "name email")
      .sort({ date: -1 });

    res.json({
      expenses,
    });
  } catch (error) {
    console.error("Get All Expenses Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== GET USER EXPENSES ====================
// Supports optional query filters: search, category, fromDate, toDate, month
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { search, category, fromDate, toDate, month } = req.query;

    const query = { userId };

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    let expenses = await Expense.find(query).sort({ date: -1 });

    if (month) {
      expenses = expenses.filter((e) => {
        const ed = new Date(e.date);
        return `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, "0")}` === month;
      });
    }

    // Return array directly to preserve 100% backward compatibility with frontend
    res.json(expenses);
  } catch (error) {
    console.error("Get Expenses Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== UPDATE EXPENSE ====================
router.put("/:id", async (req, res) => {
  try {
    // If incoming body has "title", map to "name"
    if (req.body.title && !req.body.name) {
      req.body.name = req.body.title;
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    await syncUserTotalExpense(expense.userId);
    await checkBudgetAndNotify(expense.userId, expense.category, expense.date);

    res.json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Update Expense Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== DELETE EXPENSE ====================
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found",
      });
    }

    await syncUserTotalExpense(expense.userId);

    res.json({
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete Expense Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;