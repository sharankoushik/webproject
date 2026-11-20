/*
 * Purpose: Listing import script. Reads provider listings from the project HTML pages and imports them into MongoDB as pending providers for admin verification.
 * This file documents its responsibility; application logic is unchanged.
 */

/*
 * Imports the public listings from the static city pages (public/*.html)
 * into MongoDB as "pending" providers, so the admin can verify them.
 *
 * Run:  npm run import-listings
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Provider = require("../models/Provider");

const publicDir = path.join(__dirname, "..", "..", "public");

function parsePage(html) {
  const h2 = html.match(/<h2>\s*(.+?)\s+Services in\s+(.+?)\s*<\/h2>/i);
  if (!h2 || /^Home$/i.test(h2[1])) return [];
  const service = h2[1].replace(/&amp;/g, "&");
  const city = h2[2];
  const out = [];
  const parts = html.split('<div class="card" data-name="').slice(1);
  for (const part of parts) {
    const name = part.slice(0, part.indexOf('"')).replace(/&amp;/g, "&").trim();
    const phone = ((part.match(/data-phone="([^"]*)"/) || [])[1] || "").replace(/\D/g, "").slice(-10);
    const area = ((part.match(/Area:\s*([^<]+)/) || [])[1] || "").trim();
    const exp = parseInt((part.match(/(\d+)\s*Years? Experience/i) || [])[1], 10) || 0;
    const price = ((part.match(/class="price">([^<]+)</) || [])[1] || "").trim();
    const rating = parseFloat((part.match(/class="rating">([\d.]+)</) || [])[1]) || 0;
    out.push({ name, phone, service, city, area, experience: exp, price, ratingAvg: rating, status: "pending", source: "imported" });
  }
  return out;
}

(async () => {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env first");
  await mongoose.connect(process.env.MONGODB_URI);

  let added = 0, skipped = 0;
  for (const file of fs.readdirSync(publicDir).filter((f) => f.endsWith(".html"))) {
    for (const p of parsePage(fs.readFileSync(path.join(publicDir, file), "utf8"))) {
      const exists = await Provider.findOne({ name: p.name, service: p.service, city: p.city });
      if (exists) { skipped++; continue; }
      await Provider.create(p);
      added++;
    }
  }
  console.log(`Imported ${added} listings as pending (skipped ${skipped} already present).`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });

module.exports = { parsePage };
