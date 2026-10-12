const SocialMediaExpense = require("../models/SocialMediaExpense");

// ADD SOCIAL MEDIA EXPENSE
const addSocialMediaExpense = async (req, res) => {
  try {
    const {
      userId,
      platform,
      amount,
      date,
      description,
    } = req.body;

    if (!userId || !platform || amount === undefined || !date) {
      return res.status(400).json({
        message: "User, platform, amount and date are required",
      });
    }

    const expense = await SocialMediaExpense.create({
      userId,
      platform,
      amount: Number(amount),
      date,
      description,
    });

    res.status(201).json({
      message: "Social media expense added successfully",
      expense,
    });
  } catch (error) {
    console.error("Social Media Expense Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET ALL SOCIAL MEDIA EXPENSES
const getAllSocialMediaExpenses = async (req, res) => {
  try {
    const expenses = await SocialMediaExpense.find()
      .populate("userId", "name email")
      .sort({ date: -1 });

    res.status(200).json({
      expenses,
    });
  } catch (error) {
    console.error("Get Social Media Expenses Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// GET USER SOCIAL MEDIA EXPENSES
const getUserSocialMediaExpenses = async (req, res) => {
  try {
    const expenses = await SocialMediaExpense.find({
      userId: req.params.userId,
    }).sort({ date: -1 });

    res.status(200).json({
      expenses,
    });
  } catch (error) {
    console.error("Get User Social Media Expenses Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// DELETE SOCIAL MEDIA EXPENSE
const deleteSocialMediaExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense =
      await SocialMediaExpense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({
        message: "Social media expense not found",
      });
    }

    res.status(200).json({
      message: "Social media expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete Social Media Expense Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


module.exports = {
  addSocialMediaExpense,
  getAllSocialMediaExpenses,
  getUserSocialMediaExpenses,
  deleteSocialMediaExpense,
};