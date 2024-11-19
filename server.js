// Load environment variables from a .env file
require('dotenv').config();

// Debugging line to ensure the MONGO_URI is loaded correctly
console.log('MONGO_URI:', process.env.MONGO_URI);

// Import required modules
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // Native MongoDB driver
const morgan = require('morgan'); // HTTP request logger middleware
const path = require('path'); // Node.js module for handling file paths

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000; // Use the port from environment variables or default to 3000

// MongoDB Atlas URI from environment variables
const uri = process.env.MONGO_URI;
let db; // Global variable to hold the database connection

// Establish connection to MongoDB Atlas
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db('lessonApp'); // Specify the database name
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => console.error('Could not connect to MongoDB Atlas:', error));

// Middleware setup
app.use(morgan('dev')); // Logs incoming requests for easier debugging
app.use(express.json()); // Parses incoming JSON requests and makes them available in `req.body`

// Serve static files (e.g., images) from the 'public/images' folder
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Custom handler for 404 errors when accessing missing images
app.use('/images', (req, res) => res.status(404).json({ error: 'Image not found' }));

/**
 * Route: GET /test-lesson/:id
 * Purpose: Test endpoint to fetch a specific lesson by its ID
 */
app.get('/test-lesson/:id', async (req, res) => {
  try {
    const lessonId = req.params.id.trim(); // Get the lesson ID from the request params
    const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) }); // Query the database
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' }); // Respond with 404 if lesson does not exist
    }
    res.json(lesson); // Respond with the lesson data
  } catch (err) {
    res.status(500).json({ message: err.message }); // Handle server errors
  }
});

/**
 * Route: GET /lessons
 * Purpose: Retrieve all lessons from the database
 */
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find().toArray(); // Fetch all lessons
    res.json(lessons); // Respond with the lessons array
  } catch (err) {
    res.status(500).json({ message: err.message }); // Handle server errors
  }
});

/**
 * Route: POST /orders
 * Purpose: Create a new order for lessons
 */
app.post('/orders', async (req, res) => {
  console.log('Request Body:', req.body); // Debugging: log the incoming request body

  const { name, phone, lessonIDs, space } = req.body;

  // Validate that lessonIDs is an array
  if (!Array.isArray(lessonIDs)) {
    return res.status(400).json({ error: 'lessonIDs must be an array' });
  }

  try {
    // Validate availability for each lesson
    for (const lessonID of lessonIDs) {
      const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonID.trim()) });
      if (!lesson) {
        return res.status(404).json({ error: `Lesson with ID ${lessonID} not found` });
      }
      if (lesson.space < space) {
        return res.status(400).json({ error: `Not enough spaces available for lesson ${lesson.topic}` });
      }
    }

    // Update the available space for each lesson in the order
    for (const lessonID of lessonIDs) {
      await db.collection('lessons').updateOne(
        { _id: new ObjectId(lessonID.trim()) },
        { $inc: { space: -space } } // Decrease space count
      );
    }

    // Create the order document and insert it into the database
    const order = { name, phone, lessonIDs, space };
    const result = await db.collection('orders').insertOne(order);
    res.status(201).json(result.ops[0]); // Respond with the created order
  } catch (err) {
    res.status(400).json({ message: err.message }); // Handle errors
  }
});

/**
 * Route: PUT /lessons/:id
 * Purpose: Update the attributes of a specific lesson
 */
app.put('/lessons/:id', async (req, res) => {
  const { id } = req.params; // Get lesson ID from URL
  const { topic, location, price, space } = req.body; // Get updated data from request body

  try {
    // Update the lesson in the database
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(id.trim()) },
      { $set: { topic, location, price, space } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' }); // Respond with 404 if no lesson is matched
    }

    // Fetch and return the updated lesson
    const updatedLesson = await db.collection('lessons').findOne({ _id: new ObjectId(id.trim()) });
    res.json(updatedLesson);
  } catch (err) {
    res.status(400).json({ message: err.message }); // Handle errors
  }
});

/**
 * Route: GET /
 * Purpose: Basic endpoint to check if the server is running
 */
app.get('/', (req, res) => {
  res.send('Server is running'); // Respond with a simple message
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
