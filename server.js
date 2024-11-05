require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI); // Debugging line

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Import Mongoose models
const Lesson = require('./models/Lesson');
const Order = require('./models/Order');

// Middleware
app.use(morgan('dev')); // Logger middleware
app.use(express.json()); // Body parser middleware to parse JSON request bodies
app.use('/images', express.static(path.join(__dirname, 'public/images'))); // Serve static images from 'public/images' folder
app.use('/images', (req, res) => res.status(404).json({ error: 'Image not found' })); // 404 handler for missing images

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Test route to verify if Lesson.findById works correctly
app.get('/test-lesson/:id', async (req, res) => {
  try {
    const lessonId = req.params.id.trim(); // Remove any extra whitespace or newlines
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json(lesson); // Return the lesson details if found
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /lessons route to return all lessons from MongoDB
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find(); // Fetch all lessons from MongoDB
    res.json(lessons); // Return the lessons as JSON
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /orders route to create a new order
app.post('/orders', async (req, res) => {
  const { name, phone, lessonIDs, space } = req.body; // Get order details from request body

  try {
    // Check if enough space is available for each lesson in the order
    for (const lessonID of lessonIDs) {
      const lesson = await Lesson.findById(lessonID.trim()); // Trim any whitespace from lesson ID
      if (!lesson) {
        return res.status(404).json({ error: `Lesson with ID ${lessonID} not found` });
      }
      if (lesson.space < space) {
        return res.status(400).json({ error: `Not enough spaces available for lesson ${lesson.topic}` });
      }
    }

    // Deduct spaces for each lesson in the order
    for (const lessonID of lessonIDs) {
      await Lesson.findByIdAndUpdate(lessonID.trim(), { $inc: { space: -space } });
    }

    // Create and save the order
    const order = new Order({ name, phone, lessonIDs, space });
    const savedOrder = await order.save();
    res.status(201).json(savedOrder); // Respond with the saved order
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /lessons/:id route to update a lesson's attributes in MongoDB
app.put('/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const { topic, location, price, space } = req.body; // Get updated fields from request body

  try {
    const updatedLesson = await Lesson.findByIdAndUpdate(
      id.trim(), // Trim any whitespace from ID
      { topic, location, price, space },
      { new: true, runValidators: true } // Return updated lesson and validate inputs
    );

    if (!updatedLesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(updatedLesson); // Respond with the updated lesson
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
