const express = require("express");
const router = express.Router();
const {
  addIncome,
  getUserIncomes,
  getAllIncomes,
  updateIncome,
  deleteIncome,
  updateMonthlyIncome,
} = require("../controllers/incomeController");

router.get("/", getAllIncomes);
router.get("/user/:userId", getUserIncomes);
router.post("/", addIncome);
router.post("/update-monthly", updateMonthlyIncome);
router.put("/:id", updateIncome);
router.delete("/:id", deleteIncome);

module.exports = router;
