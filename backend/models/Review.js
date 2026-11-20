/*
 * Purpose: Review database model. Defines how customer star ratings and comments for service providers are stored.
 * This file documents its responsibility; application logic is unchanged.
 */

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // providerKey is the provider's MongoDB _id, or phone/name for listings on the static pages
    providerKey: { type: String, required: true, index: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
    providerName: { type: String, trim: true, default: "" },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
    reviewerName: { type: String, trim: true, maxlength: 60, default: "Customer" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
