// models/Order.js
const mongoose = require('mongoose'); // Import Mongoose
const { Schema } = mongoose; // Destructure Schema for cleaner code

// Define the schema for the Order collection
const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },                  // Customer's name
  phone: { type: String, required: true },                 // Customer's phone number
  lessonIDs: [{ type: Schema.Types.ObjectId, ref: 'Lesson', required: true }], // References to Lesson documents
  space: { type: Number, required: true }                  // Number of spaces the customer wants to book
});

// Create and export the Order model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
