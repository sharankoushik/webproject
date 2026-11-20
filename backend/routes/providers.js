/*
 * Purpose: Provider API routes. Handles provider registration, provider listing, searching, and related provider information.
 * This file documents its responsibility; application logic is unchanged.
 */

const express = require("express");
const Provider = require("../models/Provider");

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()\\|[\]]/g, "\\$&");

// PROVIDER LISTING + SEARCH  (only admin-verified providers are public)
// GET /api/providers?service=Plumber&city=Hyderabad&q=name&sort=rating
router.get("/", async (req, res) => {
  try {
    const filter = { status: "verified" };
    if (req.query.service) filter.service = new RegExp("^" + escapeRegex(req.query.service.trim()) + "$", "i");
    if (req.query.city) filter.city = new RegExp(escapeRegex(req.query.city.trim()), "i");
    if (req.query.q) {
      const q = new RegExp(escapeRegex(req.query.q.trim()), "i");
      filter.$or = [{ name: q }, { area: q }];
    }
    const sort = req.query.sort === "experience" ? { experience: -1 } : { ratingAvg: -1, ratingCount: -1 };
    const providers = await Provider.find(filter)
      .select("-idProofType -idProofNumber -adminNote -verifiedBy")
      .sort(sort)
      .limit(100);
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: "Could not load providers." });
  }
});

// PROVIDER REGISTRATION (goes to the admin as "pending")
router.post("/register", async (req, res) => {
  try {
    const b = req.body || {};
    const name = (b.name || "").trim();
    const service = (b.service || "").trim();
    const city = (b.city || "").trim();
    const phone = (b.phone || "").replace(/\D/g, "");

    if (!name || !service || !city) return res.status(400).json({ error: "Name, service and city are required." });
    if (!/^[0-9]{10}$/.test(phone)) return res.status(400).json({ error: "Enter a valid 10-digit phone number." });
    if (!b.idProofType || !b.idProofNumber) {
      return res.status(400).json({ error: "An ID proof is required so the admin can verify you." });
    }

    const existing = await Provider.findOne({ phone, service: new RegExp("^" + escapeRegex(service) + "$", "i"), city: new RegExp("^" + escapeRegex(city) + "$", "i") });
    if (existing) return res.status(409).json({ error: "A provider with this phone number is already registered for this service." });

    await Provider.create({
      name, service, city, phone,
      area: b.area, email: b.email,
      experience: Number(b.experience) || 0,
      price: b.price, description: b.description,
      idProofType: b.idProofType, idProofNumber: b.idProofNumber,
      status: "pending", source: "registered"
    });
    res.status(201).json({ message: "Registration received. You will appear in search once the admin verifies you." });
  } catch (err) {
    res.status(500).json({ error: "Could not register provider." });
  }
});

// Which listings has the admin verified? (used to show the "Verified" badge on the static city pages)
router.get("/verified-index", async (req, res) => {
  try {
    const list = await Provider.find({ status: "verified" }).select("name phone city service").limit(2000);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Could not load verified list." });
  }
});

// One verified provider
router.get("/:id", async (req, res) => {
  try {
    const p = await Provider.findOne({ _id: req.params.id, status: "verified" }).select("-idProofType -idProofNumber -adminNote -verifiedBy");
    if (!p) return res.status(404).json({ error: "Provider not found." });
    res.json(p);
  } catch (err) {
    res.status(400).json({ error: "Invalid provider id." });
  }
});

module.exports = router;
