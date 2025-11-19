const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all drivers
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM drivers ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Fetch Drivers Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// ADD driver
router.post("/", async (req, res) => {
  const { name, phone, vehicle, city } = req.body;
  try {
    await pool.query(
      "INSERT INTO drivers (name, phone, vehicle, city, status) VALUES (?, ?, ?, ?, 'Available')",
      [name, phone, vehicle, city]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Add Driver Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// UPDATE DRIVER STATUS (MATCHES FRONTEND)
router.post("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await pool.query("UPDATE drivers SET status=? WHERE id=?", [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update Driver Status Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

// DELETE DRIVER
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM drivers WHERE id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete Driver Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
});

module.exports = router;
