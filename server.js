require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI); // Debugging line

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // Native MongoDB driver
const morgan = require('morgan');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const uri = process.env.MONGO_URI; // MongoDB Atlas URI
let db; // Declare a global variable to store the database connection

// Connect to MongoDB Atlas
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db('lessonApp'); // Replace 'lessonApp' with your database name
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => console.error('Could not connect to MongoDB Atlas:', error));

// Middleware
app.use(morgan('dev')); // Logger middleware
app.use(express.json()); // Body parser middleware to parse JSON request bodies
app.use('/images', express.static(path.join(__dirname, 'public/images'))); // Serve static images from 'public/images' folder
app.use('/images', (req, res) => res.status(404).json({ error: 'Image not found' })); // 404 handler for missing images

// Test route to verify if Lesson.findById works correctly
app.get('/test-lesson/:id', async (req, res) => {
  try {
    const lessonId = req.params.id.trim();
    const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /lessons route to return all lessons from MongoDB
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find().toArray();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /orders route to create a new order
app.post('/orders', async (req, res) => {
  const { name, phone, lessonIDs, space } = req.body;

  try {
    // Check if enough space is available for each lesson in the order
    for (const lessonID of lessonIDs) {
      const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonID.trim()) });
      if (!lesson) {
        return res.status(404).json({ error: `Lesson with ID ${lessonID} not found` });
      }
      if (lesson.space < space) {
        return res.status(400).json({ error: `Not enough spaces available for lesson ${lesson.topic}` });
      }
    }

    // Deduct spaces for each lesson in the order
    for (const lessonID of lessonIDs) {
      await db.collection('lessons').updateOne(
        { _id: new ObjectId(lessonID.trim()) },
        { $inc: { space: -space } }
      );
    }

    // Create and save the order
    const order = { name, phone, lessonIDs, space };
    const result = await db.collection('orders').insertOne(order);
    res.status(201).json(result.ops[0]); // Respond with the saved order
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /lessons/:id route to update a lesson's attributes in MongoDB
app.put('/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const { topic, location, price, space } = req.body;

  try {
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(id.trim()) },
      { $set: { topic, location, price, space } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const updatedLesson = await db.collection('lessons').findOne({ _id: new ObjectId(id.trim()) });
    res.json(updatedLesson);
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
