// Load environment variables from a .env file
require('dotenv').config();

// Import required modules
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // Native MongoDB driver
const morgan = require('morgan'); // HTTP request logger middleware
const path = require('path'); // Node.js module for handling file paths

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000; // Use the port from environment variables or default to 5000

// MongoDB Atlas URI from environment variables
const uri = process.env.MONGO_URI;
let db; // Global variable to hold the database connection

// Establish connection to MongoDB Atlas
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db('lessonApp'); // Database name
    console.log('Connected to MongoDB Atlas');
  })
  .catch((error) => console.error('Could not connect to MongoDB Atlas:', error));

// Middleware setup
app.use(morgan('dev')); // Logs incoming requests for easier debugging
app.use(express.json()); // Parses incoming JSON requests and makes them available in `req.body`

// Serve static files (e.g., images) from the 'public/images' folder
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes

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
app.get('/orders', async (req, res) => {
  try {
    const orders = await db.collection('orders').find().toArray(); // Fetch all lessons
    res.json(orders); // Respond with the lessons array
  } catch (err) {
    res.status(500).json({ message: err.message }); // Handle server errors
  }
});

/**
 * Route: POST /orders
 * Purpose: Create a new order for lessons
 */
app.post('orders', async (req, res) => {
  try {
    const { firstName, lastName, phone, cart } = req.body;

    // Validate input
    if (!firstName || !lastName || !phone || !cart || !Array.isArray(cart)) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Combine first and last name
    const name = `${firstName} ${lastName}`;

    // Extract lesson IDs and validate space
    const lessonIDs = [];
    for (const item of cart) {
      const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(item.id) });

      if (!lesson) {
        return res.status(404).json({ error: `Lesson with ID ${item.id} not found` });
      }

      if (lesson.space < 1) {
        return res.status(400).json({ error: `Not enough spaces available for lesson ${lesson.topic}` });
      }

      // Add lesson ID to the array and decrement spaces
      lessonIDs.push(item.id);
      await db.collection('lessons').updateOne(
        { _id: new ObjectId(item.id) },
        { $inc: { space: -1 } }
      );
    }

    // Create the order document
    const order = {
      name,
      phone,
      lessonIDs,
      space: cart.length, // Total number of lessons in the order
      date: new Date(), // Timestamp
    };

    // Insert the order into the database
    const result = await db.collection('orders').insertOne(order);

    res.status(201).json({ message: 'Order created successfully', order: result.ops[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
