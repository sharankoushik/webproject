/*
 * Purpose: Admin API routes. Handles admin login and the administrative actions for reviewing providers and managing platform records.
 * This file documents its responsibility; application logic is unchanged.
 */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Provider = require("../models/Provider");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// ---- simple login throttle (max 8 attempts / 10 min per IP) ----
const attempts = new Map();
function throttled(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  attempts.set(ip, list);
  return list.length >= 8;
}

// ADMIN LOGIN
router.post("/login", async (req, res) => {
  const ip = req.ip;
  if (throttled(ip)) return res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });

  const { email, password } = req.body || {};
  const okEmail = email && email.trim().toLowerCase() === (process.env.ADMIN_EMAIL || "").toLowerCase();
  // ADMIN_PASSWORD is compared via bcrypt so the plain text is never compared directly
  const hash = req.app.locals.adminPasswordHash;
  const okPass = password && hash && (await bcrypt.compare(password, hash));

  if (!okEmail || !okPass) {
    attempts.get(ip).push(Date.now());
    return res.status(401).json({ error: "Wrong admin email or password." });
  }
  const token = jwt.sign({ role: "admin", email: process.env.ADMIN_EMAIL }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ token });
});

// everything below needs a valid admin token
router.use(adminAuth);

// DASHBOARD NUMBERS
router.get("/stats", async (req, res) => {
  const [pending, verified, rejected, bookings, reviews] = await Promise.all([
    Provider.countDocuments({ status: "pending" }),
    Provider.countDocuments({ status: "verified" }),
    Provider.countDocuments({ status: "rejected" }),
    Booking.countDocuments(),
    Review.countDocuments()
  ]);
  res.json({ pending, verified, rejected, bookings, reviews });
});

// LIST PROVIDERS BY VERIFICATION STATUS (includes ID proof, which only the admin can see)
router.get("/providers", async (req, res) => {
  const status = ["pending", "verified", "rejected"].includes(req.query.status) ? req.query.status : "pending";
  const filter = { status };
  if (req.query.q) {
    const q = new RegExp(req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: q }, { phone: q }, { city: q }, { service: q }];
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 25;
  const [items, total] = await Promise.all([
    Provider.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Provider.countDocuments(filter)
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
});

// VERIFY / REJECT / RESET
async function setStatus(req, res, status) {
  try {
    const update = {
      status,
      adminNote: (req.body && req.body.note) || "",
      verifiedBy: req.admin.email,
      verifiedAt: status === "verified" ? new Date() : undefined
    };
    const p = await Provider.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!p) return res.status(404).json({ error: "Provider not found." });
    res.json(p);
  } catch (err) {
    res.status(400).json({ error: "Invalid provider id." });
  }
}
router.patch("/providers/:id/verify", (req, res) => setStatus(req, res, "verified"));
router.patch("/providers/:id/reject", (req, res) => {
  if (!req.body || !req.body.note) return res.status(400).json({ error: "Please give a reason for rejecting." });
  setStatus(req, res, "rejected");
});
router.patch("/providers/:id/reset", (req, res) => setStatus(req, res, "pending"));

// BOOKINGS (read only overview)
router.get("/bookings", async (req, res) => {
  res.json(await Booking.find().sort({ createdAt: -1 }).limit(100));
});

module.exports = router;
