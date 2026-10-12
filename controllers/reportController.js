const Report = require("../models/Report");
const Expense = require("../models/Expense");
const Saving = require("../models/Saving");
const User = require("../models/User");
const Income = require("../models/Income");

// =========================
// GENERATE REPORT
// =========================
const generateReport = async (req, res) => {
  try {
    const { reportType, fromDate, toDate, format, userId } = req.body;

    // VALIDATION
    if (!reportType || !fromDate || !toDate || !format) {
      return res.status(400).json({
        message: "All report fields are required",
      });
    }

    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      return res.status(400).json({
        message: "From Date cannot be greater than To Date",
      });
    }

    // Save report record
    const report = await Report.create({
      reportType,
      fromDate: startDate,
      toDate: endDate,
      format,
      userId: userId || null,
    });

    let data = {};
    const userFilter = userId ? { userId } : {};

    // 1. EXPENSE REPORT
    if (reportType === "Expense Report" || reportType === "Expense") {
      const expenses = await Expense.find({
        ...userFilter,
        date: { $gte: startDate, $lte: endDate },
      })
        .populate("userId", "name email")
        .sort({ date: -1 });

      const totalExpense = expenses.reduce(
        (total, expense) => total + Number(expense.amount || 0),
        0
      );

      // Category breakdown
      const categoryBreakdown = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
        return acc;
      }, {});

      data = {
        expenses,
        totalExpense,
        categoryBreakdown,
        count: expenses.length,
      };
    }

    // 2. SAVING REPORT
    else if (reportType === "Saving Report" || reportType === "Saving") {
      const savings = await Saving.find(userFilter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      const totalSaving = savings.reduce(
        (total, saving) => total + Number(saving.amount || 0),
        0
      );

      data = {
        savings,
        totalSaving,
        count: savings.length,
      };
    }

    // 3. USER REPORT
    else if (reportType === "User Report") {
      let users;
      if (userId) {
        users = await User.find({ _id: userId }).select("-password");
      } else {
        users = await User.find({ role: "user" }).select("-password").sort({ createdAt: -1 });
      }

      data = {
        users,
        totalUsers: users.length,
      };
    }

    // 4. COMPLETE FINANCIAL REPORT (OR DEFAULT)
    else {
      const expenses = await Expense.find({
        ...userFilter,
        date: { $gte: startDate, $lte: endDate },
      })
        .populate("userId", "name email")
        .sort({ date: -1 });

      const savings = await Saving.find(userFilter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      const incomes = await Income.find({
        ...userFilter,
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: -1 });

      let users = [];
      if (userId) {
        users = await User.find({ _id: userId }).select("-password");
      } else {
        users = await User.find({ role: "user" }).select("-password");
      }

      const totalExpense = expenses.reduce(
        (total, expense) => total + Number(expense.amount || 0),
        0
      );

      const totalSaving = savings.reduce(
        (total, saving) => total + Number(saving.amount || 0),
        0
      );

      // Incomes from Income collection or monthlyIncome from User
      const recordedIncomeTotal = incomes.reduce(
        (total, inc) => total + Number(inc.amount || 0),
        0
      );

      const userIncomeSum = users.reduce(
        (total, user) => total + Number(user.monthlyIncome || 0),
        0
      );

      const totalIncome = recordedIncomeTotal > 0 ? recordedIncomeTotal : userIncomeSum;
      const balance = totalIncome - totalExpense;

      const categoryBreakdown = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
        return acc;
      }, {});

      data = {
        users,
        expenses,
        savings,
        incomes,
        totalIncome,
        totalExpense,
        totalSaving,
        balance,
        categoryBreakdown,
      };
    }

    res.status(200).json({
      message: "Report generated successfully",
      report,
      data,
    });
  } catch (error) {
    console.error("Report Controller Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =========================
// GET ALL REPORTS / USER REPORTS
// =========================
const getAllReports = async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};

    const reports = await Report.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      reports,
    });
  } catch (error) {
    console.error("Get Reports Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// =========================
// DELETE REPORT
// =========================
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    res.status(200).json({
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Delete Report Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  generateReport,
  getAllReports,
  deleteReport,
};