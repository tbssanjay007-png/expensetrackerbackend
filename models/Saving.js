const mongoose = require("mongoose");

const savingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    goal: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    month: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Saving", savingSchema);