const express = require('express');
const app = express();
app.use(express.json());

// Sample endpoint
app.get('/orders', (req, res) => res.json({ orders: [] }));
app.post('/orders', (req, res) => res.json({ message: 'Order created', data: req.body }));

app.listen(3002, () => console.log('Order service on port 3002'));
// Simulates backend service for testing the gateway.