const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");

// ==================== GET USER NOTIFICATIONS ====================
router.get("/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get Notification Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== CREATE NOTIFICATION ====================
router.post("/", async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        message: "User ID and message are required",
      });
    }

    const notification = await Notification.create({
      userId,
      title: title || "Notification",
      message,
      type: type || "info",
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Create Notification Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== MARK AS READ ====================
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Read Notification Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== MARK ALL AS READ ====================
router.put("/user/:userId/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== DELETE NOTIFICATION ====================
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==================== CLEAR ALL NOTIFICATIONS ====================
router.delete("/user/:userId/clear", async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.params.userId });

    res.json({
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("Clear Notifications Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;