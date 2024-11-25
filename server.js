// Load environment variables from a .env file
require('dotenv').config(); // Ensures sensitive data like database URIs and port numbers are not hardcoded

// Import required modules
const express = require('express'); // Framework for building web applications
const { MongoClient, ObjectId } = require('mongodb'); // MongoDB driver for database operations
const morgan = require('morgan'); // Middleware for logging HTTP requests
const path = require('path'); // Module for handling and transforming file paths
const cors = require('cors'); // Middleware to enable Cross-Origin Resource Sharing (CORS)

// Create an Express application
const app = express(); // Initialises the Express app
const PORT = process.env.PORT || 3000; // Uses port from environment variables or defaults to 3000

// MongoDB Atlas URI from environment variables
const uri = process.env.MONGO_URI; // Database connection string
let db; // Global variable to store the database connection

// Establish connection to MongoDB Atlas
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }) // Ensures modern connection options
  .then((client) => {
    db = client.db('lessonApp'); // Connects to the database named 'lessonApp'
    console.log('Connected to MongoDB Atlas'); // Logs successful connection
  })
  .catch((error) => console.error('Could not connect to MongoDB Atlas:', error)); // Logs any connection errors

// Middleware setup
app.use(cors()); // Enables other domains to make requests to this server
app.use(morgan('dev')); // Logs incoming requests in a developer-friendly format
app.use(express.json()); // Parses incoming JSON requests into `req.body`

// Serve static files (e.g., images) from the 'public/images' folder
app.use('/images', express.static(path.join(__dirname, 'public/images'))); // Serves images at `/images` endpoint

// Routes

/**
 * Route: GET /lessons
 * Purpose: Retrieve all lessons from the database
 */
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find().toArray(); // Fetches all lessons from the database
    res.json(lessons); // Sends the lessons data back as a JSON response
  } catch (err) {
    res.status(500).json({ message: err.message }); // Responds with an error message in case of failure
  }
});

/**
 * Route: POST /orders
 * Purpose: Create a new order for lessons
 */
app.post('/orders', async (req, res) => {
  try {
    const { firstName, lastName, phone, cart } = req.body; // Destructures the request body

    // Validate input
    if (!firstName || !lastName || !phone || !cart || !Array.isArray(cart)) {
      return res.status(400).json({ error: 'Invalid order data' }); // Responds with a validation error
    }

    const name = `${firstName} ${lastName}`; // Combines first and last name for the order

    const lessonIDs = []; // Array to store validated lesson IDs
    for (const item of cart) {
      const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(item.id) }); // Fetches lesson by ID

      if (!lesson) {
        return res.status(404).json({ error: `Lesson with ID ${item.id} not found` }); // Error if lesson doesn't exist
      }

      if (lesson.space < 1) {
        return res.status(400).json({ error: `Not enough spaces available for lesson ${lesson.topic}` }); // Error if no space
      }

      lessonIDs.push(item.id); // Adds valid lesson ID to the array
      await db.collection('lessons').updateOne(
        { _id: new ObjectId(item.id) }, 
        { $inc: { space: -1 } } // Decrements available spaces for the lesson
      );
    }

    const order = {
      name, // Customer's full name
      phone, // Customer's phone number
      lessonIDs, // IDs of the lessons being ordered
      space: cart.length, // Total lessons in the cart
      date: new Date(), // Current timestamp
    };

    const result = await db.collection('orders').insertOne(order); // Inserts the order into the database

    res.status(201).json({ message: 'Order created successfully', orderId: result.insertedId }); // Responds with success
  } catch (err) {
    console.error(err); // Logs any server error
    res.status(500).json({ message: 'Internal server error' }); // Responds with an internal server error
  }
});

/**
 * Route: GET /orders
 * Purpose: Retrieve all orders from the database
 */
app.get('/orders', async (req, res) => {
  try {
    const orders = await db.collection('orders').find().toArray(); // Fetches all orders from the database
    res.json(orders); // Sends the orders data back as a JSON response
  } catch (err) {
    console.error(err); // Logs the error for debugging
    res.status(500).json({ message: 'Internal server error' }); // Responds with an error message
  }
});

/**
 * Route: PUT /lessons/:id
 * Purpose: Update the attributes of a specific lesson
 */
app.put('/lessons/:id', async (req, res) => {
  const { id } = req.params; // Extracts lesson ID from the URL
  const { topic, location, price, space } = req.body; // Destructures the request body

  try {
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(id.trim()) },
      { $set: { topic, location, price, space } } // Updates the lesson's attributes
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' }); // Responds with 404 if no match
    }

    const updatedLesson = await db.collection('lessons').findOne({ _id: new ObjectId(id.trim()) }); // Fetches updated lesson
    res.json(updatedLesson); // Responds with the updated lesson data
  } catch (err) {
    res.status(400).json({ message: err.message }); // Handles invalid ID errors
  }
});

/**
 * Route: GET /test-lesson/:id
 * Purpose: Test endpoint to fetch a specific lesson by its ID
 */
app.get('/test-lesson/:id', async (req, res) => {
  try {
    const lessonId = req.params.id.trim(); // Extracts lesson ID from the URL
    const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) }); // Queries the database
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' }); // Responds if lesson doesn't exist
    }
    res.json(lesson); // Sends the lesson data back
  } catch (err) {
    res.status(500).json({ message: err.message }); // Handles errors
  }
});

/**
 * Route: GET /
 * Purpose: Basic endpoint to check if the server is running
 */
app.get('/', (req, res) => {
  res.send('Server is running'); // Simple message to verify server status
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`); // Logs the server's URL
});
