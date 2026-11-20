/*
 * Purpose: Booking API routes. Creates customer booking requests and provides booking records for the relevant views.
 * This file documents its responsibility; application logic is unchanged.
 */

const express = require("express");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");

const router = express.Router();

// BOOKING: create a booking request
router.post("/", async (req, res) => {
  try {
    const b = req.body || {};
    let providerName = (b.providerName || "").trim();
    let providerPhone = (b.providerPhone || "").replace(/\D/g, "").slice(-10);
    let service = b.service, city = b.city;
    let providerId;

    if (b.providerId) {
      const p = await Provider.findOne({ _id: b.providerId, status: "verified" });
      if (!p) return res.status(400).json({ error: "This provider is not verified yet." });
      providerId = p._id; providerName = p.name; providerPhone = p.phone; service = p.service; city = p.city;
    }
    if (!providerName) return res.status(400).json({ error: "Provider is required." });

    const booking = await Booking.create({
      providerId, providerName, providerPhone, service, city,
      customerName: b.customerName, customerPhone: b.customerPhone, customerEmail: b.customerEmail,
      locationLink: b.locationLink, note: b.note
    });
    res.status(201).json({ message: "Booking saved.", id: booking._id });
  } catch (err) {
    res.status(500).json({ error: "Could not save booking." });
  }
});

// Bookings made with a given email (for a "my bookings" view)
router.get("/", async (req, res) => {
  const email = (req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "email is required." });
  const bookings = await Booking.find({ customerEmail: email }).sort({ createdAt: -1 }).limit(50);
  res.json(bookings);
});

module.exports = router;
