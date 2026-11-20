/*
 * Purpose: Booking database model. Defines the MongoDB fields and validation rules used to store customer booking requests.
 * This file documents its responsibility; application logic is unchanged.
 */

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // providerId is set for providers stored in MongoDB.
    // providerName/providerPhone are kept so bookings from the static city pages also work.
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
    providerName: { type: String, required: true, trim: true },
    providerPhone: { type: String, trim: true, default: "" },
    service: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    customerName: { type: String, trim: true, default: "" },
    customerPhone: { type: String, trim: true, default: "" },
    customerEmail: { type: String, trim: true, lowercase: true, default: "" },
    locationLink: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["requested", "confirmed", "completed", "cancelled"], default: "requested" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
