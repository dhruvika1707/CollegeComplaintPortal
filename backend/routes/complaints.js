const express = require("express");
const router = express.Router();

const Complaint = require("../models/Complaint");
const { protect, adminOnly } = require("../authMiddleware");


// CREATE complaint
router.post("/", protect, async (req, res) => {
  try {
    const complaint = await Complaint.create({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// READ all complaints — Admin only
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// READ logged-in user's complaints
router.get("/my", protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});


// READ one complaint
router.get("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});


// UPDATE complaint — Admin only
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    res.json(complaint);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});


// DELETE complaint — Admin only
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(
      req.params.id
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    res.json({
      message: "Complaint deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});


module.exports = router;