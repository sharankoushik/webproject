/*
 * Purpose: Service provider database model. Defines provider details, service and city information, verification status, and rating totals.
 * This file documents its responsibility; application logic is unchanged.
 */

const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    service: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    experience: { type: Number, min: 0, default: 0 },
    price: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    idProofType: { type: String, trim: true, default: "" },
    idProofNumber: { type: String, trim: true, default: "" },

    // Admin Verification module
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    verifiedAt: Date,
    verifiedBy: String,
    adminNote: { type: String, default: "" },

    // Ratings module (kept up to date whenever a review is added)
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    source: { type: String, enum: ["registered", "imported", "seed"], default: "registered" }
  },
  { timestamps: true }
);

providerSchema.index({ service: 1, city: 1, status: 1 });
providerSchema.index({ name: "text", area: "text" });

module.exports = mongoose.model("Provider", providerSchema);
