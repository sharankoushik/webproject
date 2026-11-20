/*
 * Purpose: Ratings API routes. Accepts customer reviews, validates star ratings, and updates provider rating summaries.
 * This file documents its responsibility; application logic is unchanged.
 */

const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Provider = require("../models/Provider");

const router = express.Router();

// RATINGS: add a rating (1-5) and optional comment
router.post("/", async (req, res) => {
  try {
    const b = req.body || {};
    const stars = Number(b.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    let providerKey = (b.providerKey || "").trim();
    let providerId, providerName = (b.providerName || "").trim();

    if (b.providerId && mongoose.isValidObjectId(b.providerId)) {
      const p = await Provider.findOne({ _id: b.providerId, status: "verified" });
      if (!p) return res.status(400).json({ error: "This provider is not verified." });
      providerId = p._id; providerKey = String(p._id); providerName = p.name;
    }
    if (!providerKey) return res.status(400).json({ error: "Provider is required." });

    await Review.create({
      providerKey, providerId, providerName, stars,
      comment: b.comment, reviewerName: b.reviewerName || "Customer"
    });

    // keep the provider's average up to date
    if (providerId) {
      const [agg] = await Review.aggregate([
        { $match: { providerId } },
        { $group: { _id: null, avg: { $avg: "$stars" }, count: { $sum: 1 } } }
      ]);
      await Provider.findByIdAndUpdate(providerId, {
        ratingAvg: Math.round(agg.avg * 10) / 10, ratingCount: agg.count
      });
    }
    res.status(201).json({ message: "Thanks for your rating!" });
  } catch (err) {
    res.status(500).json({ error: "Could not save rating." });
  }
});

// Reviews + average for one provider (by _id or by key such as phone number)
router.get("/:key", async (req, res) => {
  const reviews = await Review.find({ providerKey: req.params.key }).sort({ createdAt: -1 }).limit(50);
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.stars, 0) / count) * 10) / 10 : 0;
  res.json({ average, count, reviews });
});

module.exports = router;
