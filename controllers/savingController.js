const Saving = require("../models/Saving");


// =========================
// UPDATE / ADD SAVING
// =========================
const updateSaving = async (req, res) => {
  try {
    const {
      userId,
      goal,
      amount,
      month
    } = req.body;

    // Validation
    if (!userId || !goal || amount === undefined || !month) {
      return res.status(400).json({
        message: "All saving fields are required"
      });
    }

    // Check whether this user already has saving for this month
    let saving = await Saving.findOne({
      userId,
      month
    });

    if (saving) {
      // Update existing saving
      saving.goal = goal;
      saving.amount = Number(amount);

      await saving.save();

    } else {
      // Create new saving
      saving = await Saving.create({
        userId,
        goal,
        amount: Number(amount),
        month
      });
    }

    res.status(200).json({
      message: "Saving updated successfully",
      saving
    });

  } catch (error) {
    console.error("Saving Update Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// =========================
// GET ALL SAVINGS
// =========================
const getAllSavings = async (req, res) => {
  try {
    const savings = await Saving.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      savings
    });

  } catch (error) {
    console.error("Get Savings Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// =========================
// GET USER SAVINGS
// =========================
const getUserSavings = async (req, res) => {
  try {
    const { userId } = req.params;

    const savings = await Saving.find({
      userId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      savings
    });

  } catch (error) {
    console.error("Get User Savings Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// =========================
// DELETE SAVING
// =========================
const deleteSaving = async (req, res) => {
  try {
    const { id } = req.params;

    const saving = await Saving.findByIdAndDelete(id);

    if (!saving) {
      return res.status(404).json({
        message: "Saving not found"
      });
    }

    res.status(200).json({
      message: "Saving deleted successfully"
    });

  } catch (error) {
    console.error("Delete Saving Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


module.exports = {
  updateSaving,
  getAllSavings,
  getUserSavings,
  deleteSaving
};