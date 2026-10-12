const express = require("express");

const router = express.Router();

const {
  updateSaving,
  getAllSavings,
  getUserSavings,
  deleteSaving
} = require("../controllers/savingController");


// =========================
// UPDATE / ADD SAVING
// =========================
router.post("/update", updateSaving);


// =========================
// GET ALL SAVINGS
// =========================
router.get("/", getAllSavings);


// =========================
// GET USER SAVINGS
// =========================
router.get("/user/:userId", getUserSavings);


// =========================
// DELETE SAVING
// =========================
router.delete("/:id", deleteSaving);


module.exports = router;