const express = require("express");

const router = express.Router();

const {
  addSocialMediaExpense,
  getAllSocialMediaExpenses,
  getUserSocialMediaExpenses,
  deleteSocialMediaExpense,
} = require("../controllers/socialMediaExpenseController");


router.post("/add", addSocialMediaExpense);

router.get("/", getAllSocialMediaExpenses);

router.get("/user/:userId", getUserSocialMediaExpenses);

router.delete("/:id", deleteSocialMediaExpense);


module.exports = router;