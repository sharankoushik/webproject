/*
 * Purpose: Admin authentication middleware. Checks the JWT bearer token on protected admin requests and allows only valid admin sessions.
 * This file documents its responsibility; application logic is unchanged.
 */

const jwt = require("jsonwebtoken");

module.exports = function adminAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Admin login required." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") throw new Error("not admin");
    req.admin = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
};
