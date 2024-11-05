// models/Lesson.js
const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  space: { type: Number, required: true }
});

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson; // Ensure Lesson is exported correctly
