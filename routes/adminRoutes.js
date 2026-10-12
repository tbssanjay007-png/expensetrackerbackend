const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Expense = require("../models/Expense");
const Saving = require("../models/Saving");
const Income = require("../models/Income");
const Budget = require("../models/Budget");
const Notification = require("../models/Notification");
const Category = require("../models/Category");

const router = express.Router();

// =====================================================
// ADMIN LOGIN
// POST /api/admin/login
// =====================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const admin = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "admin",
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid admin email or password",
      });
    }

    if (admin.isActive === false) {
      return res.status(403).json({
        message: "Admin account is inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid admin email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: admin._id.toString(),
        role: admin.role,
      },
      process.env.JWT_SECRET || "expense_tracker_secret",
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// GET ALL USERS
// GET /api/admin/users
// =====================================================
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// GET SINGLE USER DETAILS
// GET /api/admin/users/:id
// =====================================================
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const expenses = await Expense.find({ userId: user._id }).sort({ date: -1 });
    const savings = await Saving.find({ userId: user._id }).sort({ createdAt: -1 });
    const incomes = await Income.find({ userId: user._id }).sort({ date: -1 });
    const budgets = await Budget.find({ userId: user._id });

    return res.status(200).json({
      user,
      expenses,
      savings,
      incomes,
      budgets,
    });
  } catch (error) {
    console.error("Get User Details Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =====================================================
// UPDATE USER DETAILS
// PUT /api/admin/users/:id
// =====================================================
router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, monthlyIncome, phone, isActive, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (monthlyIncome !== undefined) user.monthlyIncome = Number(monthlyIncome);
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (role && ["user", "admin"].includes(role)) user.role = role;

    if (email && email.toLowerCase().trim() !== user.email) {
      const emailTaken = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id },
      });
      if (emailTaken) {
        return res.status(400).json({ message: "Email is already in use by another user" });
      }
      user.email = email.toLowerCase().trim();
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin Update User Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =====================================================
// GET DASHBOARD DATA & ANALYTICS
// GET /api/admin/dashboard
// =====================================================
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ role: "user", isActive: true });
    const inactiveUsers = await User.countDocuments({ role: "user", isActive: false });

    const users = await User.find({ role: "user" });

    // Total actual recorded expenses
    const allExpenses = await Expense.find().populate("userId", "name email").sort({ date: -1 });
    const totalExpense = allExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    // Total savings
    const allSavings = await Saving.find().populate("userId", "name email");
    const totalSaving = allSavings.reduce((sum, sav) => sum + Number(sav.amount || 0), 0);

    // Total income
    const allIncomes = await Income.find();
    const incomeRecordsTotal = allIncomes.reduce((sum, inc) => sum + Number(inc.amount || 0), 0);
    const userIncomeSum = users.reduce((sum, user) => sum + (user.monthlyIncome || 0), 0);
    const totalIncome = incomeRecordsTotal > 0 ? incomeRecordsTotal : userIncomeSum;

    // Recent transactions (last 6)
    const recentTransactions = allExpenses.slice(0, 6);

    // Category-wise summary
    const categorySummary = allExpenses.reduce((acc, exp) => {
      const cat = exp.category || "Other";
      acc[cat] = (acc[cat] || 0) + Number(exp.amount || 0);
      return acc;
    }, {});

    // Monthly financial trend (last 6 months)
    const monthlyTrend = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyTrend[key] = { month: key, expenses: 0, income: 0 };
    }

    allExpenses.forEach((exp) => {
      const d = new Date(exp.date);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyTrend[key]) {
        monthlyTrend[key].expenses += Number(exp.amount || 0);
      }
    });

    allIncomes.forEach((inc) => {
      const d = new Date(inc.date);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyTrend[key]) {
        monthlyTrend[key].income += Number(inc.amount || 0);
      }
    });

    return res.status(200).json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalIncome,
      totalExpense,
      totalSaving,
      totalTransactions: allExpenses.length,
      recentTransactions,
      categorySummary,
      monthlyTrend: Object.values(monthlyTrend),
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =====================================================
// GET SYSTEM ACTIVITY
// GET /api/admin/activity
// =====================================================
router.get("/activity", async (req, res) => {
  try {
    const activities = [];

    // Recent user signups
    const recentUsers = await User.find({ role: "user" }).sort({ createdAt: -1 }).limit(5);
    recentUsers.forEach((u) => {
      activities.push({
        id: `user-${u._id}`,
        type: "user",
        icon: "bi-person-plus",
        title: `${u.name} registered`,
        subtitle: u.email,
        timestamp: u.createdAt,
      });
    });

    // Recent expenses
    const recentExpenses = await Expense.find().populate("userId", "name").sort({ createdAt: -1 }).limit(10);
    recentExpenses.forEach((e) => {
      activities.push({
        id: `exp-${e._id}`,
        type: "expense",
        icon: "bi-receipt",
        title: `${e.userId?.name || "User"} spent ₹${Number(e.amount).toLocaleString("en-IN")}`,
        subtitle: `${e.category} - ${e.name || e.description || "Expense"}`,
        timestamp: e.createdAt || e.date,
      });
    });

    // Recent savings
    const recentSavings = await Saving.find().populate("userId", "name").sort({ updatedAt: -1 }).limit(5);
    recentSavings.forEach((s) => {
      activities.push({
        id: `sav-${s._id}`,
        type: "saving",
        icon: "bi-piggy-bank",
        title: `${s.userId?.name || "User"} updated savings`,
        subtitle: `Goal: ${s.goal} (₹${Number(s.amount).toLocaleString("en-IN")})`,
        timestamp: s.updatedAt || s.createdAt,
      });
    });

    // Sort all activities newest first
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ activities: activities.slice(0, 15) });
  } catch (error) {
    console.error("Activity Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =====================================================
// SYSTEM MONITORING
// GET /api/admin/monitoring
// =====================================================
router.get("/monitoring", async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const expensesCount = await Expense.countDocuments();
    const savingsCount = await Saving.countDocuments();
    const incomesCount = await Income.countDocuments();
    const budgetsCount = await Budget.countDocuments();
    const categoriesCount = await Category.countDocuments();
    const notificationsCount = await Notification.countDocuments();

    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    const memoryUsage = process.memoryUsage();

    res.json({
      status: "online",
      database: {
        status: dbStatusMap[dbState] || "Unknown",
        connected: dbState === 1,
        host: mongoose.connection.host || "MongoDB Atlas",
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryRssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
      collections: {
        users: usersCount,
        expenses: expensesCount,
        savings: savingsCount,
        incomes: incomesCount,
        budgets: budgetsCount,
        categories: categoriesCount,
        notifications: notificationsCount,
      },
    });
  } catch (error) {
    console.error("Monitoring Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =====================================================
// UPDATE USER STATUS
// PUT /api/admin/users/:id/status
// =====================================================
router.put("/users/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: "user",
      },
      {
        isActive: isActive,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User status updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================================================
// DELETE USER
// DELETE /api/admin/users/:id
// =====================================================
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      role: "user",
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Clean up user financial records
    await Expense.deleteMany({ userId: req.params.id });
    await Saving.deleteMany({ userId: req.params.id });
    await Income.deleteMany({ userId: req.params.id });
    await Budget.deleteMany({ userId: req.params.id });
    await Notification.deleteMany({ userId: req.params.id });

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);

    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;