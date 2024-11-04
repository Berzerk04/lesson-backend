const express = require('express'); // Import Express
const morgan = require('morgan'); // Import Morgan for logging
const app = express(); // Initialize Express
const PORT = 3000; // Define a port for the server

// Logger Middleware - logs each request to the console
app.use(morgan('dev'));

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
