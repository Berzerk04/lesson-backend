const express = require('express'); // Import Express
const morgan = require('morgan'); // Import Morgan for logging
const path = require('path'); // Import Path module to work with file paths

const app = express(); // Initialize Express
const PORT = 3000; // Define a port for the server

// Logger Middleware - logs each request to the console
app.use(morgan('dev'));

// Static File Middleware - serves files from the 'public/images' directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Error Handling for Missing Images - returns a 404 error if an image is not found
app.use('/images', (req, res) => {
  res.status(404).json({ error: 'Image not found' });
});

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
