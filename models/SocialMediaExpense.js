const mongoose = require("mongoose");

const socialMediaExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    platform: {
      type: String,
      required: true,
      enum: [
        "Instagram",
        "YouTube",
        "Facebook",
        "Netflix",
        "Spotify",
        "Amazon Prime",
        "LinkedIn",
        "X / Twitter",
      ],
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: Date,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SocialMediaExpense",
  socialMediaExpenseSchema
);