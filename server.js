require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI); // Debugging line

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // Logger middleware
app.use(express.json()); // Body parser middleware to parse JSON request bodies
app.use('/images', express.static(path.join(__dirname, 'public/images'))); // Static file middleware to serve images
app.use('/images', (req, res) => res.status(404).json({ error: 'Image not found' })); // Error handling for missing images

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Sample lessons data (in-memory array for demonstration)
let lessons = [
  { id: 1, topic: 'math', location: 'Hendon', price: 100, space: 5 },
  { id: 2, topic: 'math', location: 'Colindale', price: 80, space: 2 },
  { id: 3, topic: 'math', location: 'Brent Cross', price: 90, space: 6 },
  { id: 4, topic: 'math', location: 'Golders Green', price: 95, space: 7 }
];

// In-memory array to store orders
let orders = [];

// GET /lessons route to return all lessons as JSON (Part A)
app.get('/lessons', (req, res) => {
  res.json(lessons);
});

// POST /orders route to create a new order (Part B)
app.post('/orders', (req, res) => {
  const { lessonId, quantity } = req.body; // Get lessonId and quantity from the request body
  const lesson = lessons.find((l) => l.id === lessonId); // Find the lesson by ID

  if (lesson && lesson.space >= quantity) {
    // Check if lesson exists and if there are enough spaces available
    lesson.space -= quantity; // Reduce available spaces for the lesson
    const newOrder = { lessonId, quantity }; // Create a new order object
    orders.push(newOrder); // Add the order to the orders array
    res.status(201).json(newOrder); // Respond with the new order as JSON
  } else {
    // If there aren’t enough spaces or the lesson is not found, respond with an error
    res.status(400).json({ error: 'Not enough spaces available' });
  }
});

// PUT /lessons/:id route to update a lesson's attributes (Part C)
app.put('/lessons/:id', (req, res) => {
  const lessonId = parseInt(req.params.id); // Get the lesson ID from the route
  const lesson = lessons.find((l) => l.id === lessonId); // Find the lesson by ID

  if (!lesson) {
    // If lesson is not found, respond with an error
    return res.status(404).json({ error: 'Lesson not found' });
  }

  // Update lesson attributes based on the request body
  const { topic, location, price, space } = req.body;

  if (topic !== undefined) lesson.topic = topic;
  if (location !== undefined) lesson.location = location;
  if (price !== undefined) lesson.price = price;
  if (space !== undefined) lesson.space = space;

  res.json(lesson); // Respond with the updated lesson
});

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
