const express = require('express'); // Import Express
const morgan = require('morgan'); // Import Morgan for logging
const path = require('path'); // Import the path module
const app = express(); // Initialize Express
const PORT = 3000; // Define a port for the server

// Middleware
app.use(morgan('dev')); // Logger middleware
app.use(express.json()); // Body parser middleware
app.use('/images', express.static(path.join(__dirname, 'public/images'))); // Static file middleware
app.use('/images', (req, res) => res.status(404).json({ error: 'Image not found' })); // Error handling for missing images

// Sample lessons data (in-memory array for demonstration)
let lessons = [
  { id: 1, topic: 'math', location: 'Hendon', price: 100, space: 5 },
  { id: 2, topic: 'math', location: 'Colindale', price: 80, space: 2 },
  { id: 3, topic: 'math', location: 'Brent Cross', price: 90, space: 6 },
  { id: 4, topic: 'math', location: 'Golders Green', price: 95, space: 7 }
];

// GET /lessons route to return all lessons as JSON (Part A)
app.get('/lessons', (req, res) => {
  res.json(lessons);
});

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
