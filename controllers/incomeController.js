const Income = require("../models/Income");
const User = require("../models/User");
const Notification = require("../models/Notification");

// RECALCULATE USER MONTHLY INCOME
const syncUserMonthlyIncome = async (userId) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const incomes = await Income.find({ userId, month: currentMonth });
    if (incomes.length > 0) {
      const sum = incomes.reduce((tot, inc) => tot + Number(inc.amount || 0), 0);
      await User.findByIdAndUpdate(userId, { monthlyIncome: sum });
    }
  } catch (err) {
    console.error("Error syncing user monthly income:", err);
  }
};

// ADD INCOME
const addIncome = async (req, res) => {
  try {
    const { userId, source, amount, date, description, isRecurring } = req.body;

    if (!userId || !source || amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ message: "Valid user, source, and amount are required" });
    }

    const incomeDate = date ? new Date(date) : new Date();
    const month = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, "0")}`;

    const income = await Income.create({
      userId,
      source: source.trim(),
      amount: Number(amount),
      date: incomeDate,
      month,
      description: description || "",
      isRecurring: Boolean(isRecurring),
    });

    // Update user monthlyIncome
    const user = await User.findById(userId);
    if (user) {
      user.monthlyIncome = (user.monthlyIncome || 0) + Number(amount);
      await user.save();
    }

    // Optional notification
    await Notification.create({
      userId,
      title: "Income Recorded",
      message: `₹${Number(amount).toLocaleString("en-IN")} from ${source} has been added to your income.`,
      type: "income",
    });

    res.status(201).json({ message: "Income added successfully", income });
  } catch (error) {
    console.error("Add Income Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET USER INCOMES
const getUserIncomes = async (req, res) => {
  try {
    const { userId } = req.params;
    const incomes = await Income.find({ userId }).sort({ date: -1 });

    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.json({ incomes, totalIncome });
  } catch (error) {
    console.error("Get User Incomes Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL INCOMES (ADMIN)
const getAllIncomes = async (req, res) => {
  try {
    const incomes = await Income.find()
      .populate("userId", "name email monthlyIncome")
      .sort({ date: -1 });

    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.json({ incomes, totalIncome });
  } catch (error) {
    console.error("Get All Incomes Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE INCOME
const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!income) {
      return res.status(404).json({ message: "Income record not found" });
    }

    await syncUserMonthlyIncome(income.userId);

    res.json({ message: "Income updated successfully", income });
  } catch (error) {
    console.error("Update Income Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE INCOME
const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const income = await Income.findByIdAndDelete(id);

    if (!income) {
      return res.status(404).json({ message: "Income record not found" });
    }

    await syncUserMonthlyIncome(income.userId);

    res.json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Delete Income Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DIRECT UPDATE OF USER MONTHLY INCOME
const updateMonthlyIncome = async (req, res) => {
  try {
    const { userId, monthlyIncome } = req.body || {};
    if (!userId || monthlyIncome === undefined) {
      return res.status(400).json({ message: "userId and monthlyIncome are required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { monthlyIncome: Number(monthlyIncome) },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Monthly income updated successfully", user });
  } catch (error) {
    console.error("Update Monthly Income Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addIncome,
  getUserIncomes,
  getAllIncomes,
  updateIncome,
  deleteIncome,
  updateMonthlyIncome,
};
