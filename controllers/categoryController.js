const Category = require("../models/Category");

const defaultCategories = [
  { name: "Food", type: "expense", icon: "bi-cup-hot", color: "#e74c3c", isDefault: true },
  { name: "Travel", type: "expense", icon: "bi-bus-front", color: "#3498db", isDefault: true },
  { name: "Shopping", type: "expense", icon: "bi-bag", color: "#9b59b6", isDefault: true },
  { name: "Entertainment", type: "expense", icon: "bi-film", color: "#f39c12", isDefault: true },
  { name: "Utilities", type: "expense", icon: "bi-lightning-charge", color: "#1abc9c", isDefault: true },
  { name: "Healthcare", type: "expense", icon: "bi-heart-pulse", color: "#e67e22", isDefault: true },
  { name: "Education", type: "expense", icon: "bi-book", color: "#2ecc71", isDefault: true },
  { name: "Social Media", type: "expense", icon: "bi-phone", color: "#3b5998", isDefault: true },
  { name: "Bills", type: "expense", icon: "bi-receipt-cutoff", color: "#34495e", isDefault: true },
  { name: "Salary", type: "income", icon: "bi-cash-stack", color: "#27ae60", isDefault: true },
  { name: "Freelance", type: "income", icon: "bi-laptop", color: "#2980b9", isDefault: true },
  { name: "Investment", type: "income", icon: "bi-graph-up-arrow", color: "#8e44ad", isDefault: true },
  { name: "Other", type: "expense", icon: "bi-three-dots", color: "#7f8c8d", isDefault: true },
];

const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(defaultCategories);
      console.log("Default categories seeded successfully");
    }
  } catch (err) {
    console.error("Error seeding categories:", err);
  }
};

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ isDefault: -1, name: 1 });
    if (categories.length === 0) {
      await seedDefaultCategories();
      categories = await Category.find().sort({ isDefault: -1, name: 1 });
    }
    res.json({ categories });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// CREATE CATEGORY
const createCategory = async (req, res) => {
  try {
    const { name, type, icon, color, userId } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name: name.trim(),
      type: type || "expense",
      icon: icon || "bi-tag",
      color: color || "#24165c",
      isDefault: false,
      createdBy: userId || null,
    });

    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    console.error("Create Category Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, icon, color } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { name, type, icon, color },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Update Category Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.isDefault) {
      return res.status(400).json({ message: "Default system categories cannot be deleted" });
    }

    await Category.findByIdAndDelete(id);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete Category Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
};
