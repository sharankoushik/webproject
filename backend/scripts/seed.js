/*
 * Purpose: Demo data seed script. Adds sample service providers to MongoDB for local testing and demonstration.
 * This file documents its responsibility; application logic is unchanged.
 */

/*
 * Adds a few demo providers: some already verified, a few pending (so the admin page has something to show).
 * Run:  npm run seed
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const Provider = require("../models/Provider");

const demo = [
  { name: "Ravi Kumar", service: "Plumber", city: "Hyderabad", area: "Madhapur", phone: "9000000001", experience: 8, price: "₹300 / Visit", ratingAvg: 4.8, ratingCount: 12, status: "verified" },
  { name: "Suresh Electricals", service: "Electrician", city: "Hyderabad", area: "Kukatpally", phone: "9000000002", experience: 6, price: "₹250 / Visit", ratingAvg: 4.7, ratingCount: 9, status: "verified" },
  { name: "CleanHome Services", service: "Cleaner", city: "Bengaluru", area: "Indiranagar", phone: "9000000003", experience: 5, price: "₹500 / Service", ratingAvg: 4.9, ratingCount: 21, status: "verified" },
  { name: "Sai Carpentry Works", service: "Carpenter", city: "Chennai", area: "T Nagar", phone: "9000000004", experience: 10, price: "₹400 / Visit", ratingAvg: 4.6, ratingCount: 7, status: "verified" },
  { name: "Anil Plumbing (new)", service: "Plumber", city: "Mumbai", area: "Andheri", phone: "9000000005", experience: 3, price: "₹350 / Visit", idProofType: "Aadhaar", idProofNumber: "XXXX-XXXX-1234", status: "pending" },
  { name: "QuickFix AC (new)", service: "AC Technician", city: "Hyderabad", area: "Gachibowli", phone: "9000000006", experience: 4, price: "₹400 / Visit", idProofType: "PAN", idProofNumber: "ABCDE1234F", status: "pending" }
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  let added = 0;
  for (const d of demo) {
    if (!(await Provider.findOne({ phone: d.phone }))) {
      await Provider.create({ ...d, source: "seed", verifiedAt: d.status === "verified" ? new Date() : undefined, verifiedBy: d.status === "verified" ? "seed" : undefined });
      added++;
    }
  }
  console.log(`Seeded ${added} demo providers.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
