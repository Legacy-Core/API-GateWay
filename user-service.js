// Import Express for creating the web server
const express = require('express');
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Mock endpoint: GET /users
app.get('/users', (req, res) => {
  res.json({ users: [] });
  // Returns an empty array to simulate a user list
});

// Mock endpoint: POST /users
app.post('/users', (req, res) => {
  res.json({ message: 'User created', data: req.body });
  // Echoes back the request body with a success message
});

// Mock endpoint: GET /users/:id
app.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
  // Returns the requested user ID
});

// Start the server on port 3001
app.listen(3001, () => {
  console.log('User service is running on port 3001');
  // Confirms the service is running
});