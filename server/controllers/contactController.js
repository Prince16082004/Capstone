const Contact = require("../models/Contact");

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and message.",
      });
    }

    const contact = await Contact.create({ name, email, message });

    res.status(201).json({
      success: true,
      message: "Your message has been received. We will get back to you soon!",
      data: contact,
    });
  } catch (error) {
    // Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};

// @desc    Get all contact submissions (admin use)
// @route   GET /api/contact
// @access  Public (protect with auth middleware in production)
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { submitContact, getContacts };
