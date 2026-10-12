const express = require("express");
const router = express.Router();
const {
  getUserBudgets,
  getAllBudgets,
  setBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

router.get("/", getAllBudgets);
router.get("/user/:userId", getUserBudgets);
router.post("/", setBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
