const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const dns = require("dns");
const connectDB = require("./controllers/db");

dotenv.config();

const app = express();

// ================= DNS =================
dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DATABASE =================
connectDB();

// ================= ROUTES =================
const expenseRoutes = require("./routes/expenseRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const savingRoutes = require("./routes/savingRoutes");
const reportRoutes = require("./routes/reportRoutes");
const socialMediaExpenseRoutes = require("./routes/socialMediaExpenseRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

// ================= USE ROUTES =================
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/savings", savingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/social-media-expenses", socialMediaExpenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/categories", categoryRoutes);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.json({
    message: "Expense Tracker Backend is running",
    endpoints: {
      auth: "/api/auth",
      expenses: "/api/expenses",
      income: "/api/income",
      budgets: "/api/budgets",
      categories: "/api/categories",
      savings: "/api/savings",
      reports: "/api/reports",
      notifications: "/api/notifications",
      admin: "/api/admin",
      socialMediaExpenses: "/api/social-media-expenses",
    }
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});