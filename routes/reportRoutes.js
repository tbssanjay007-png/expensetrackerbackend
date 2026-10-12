const express = require("express");
const router = express.Router();
const {
  generateReport,
  getAllReports,
  deleteReport,
} = require("../controllers/reportController");

// GENERATE REPORT (POST /api/reports/generate)
router.post("/generate", generateReport);

// GET ALL REPORTS (GET /api/reports)
router.get("/", getAllReports);

// DELETE REPORT (DELETE /api/reports/:id)
router.delete("/:id", deleteReport);

module.exports = router;