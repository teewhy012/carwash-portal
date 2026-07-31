const express = require('express');
const cors = require('cors');
require('dotenv').config();

const customerRoutes = require('./routes/customers');
const vehicleRoutes = require('./routes/vehicles');
const serviceRoutes = require('./routes/services');
const employeeRoutes = require('./routes/employees');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const posRoutes = require('./routes/pos');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pos', posRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const path = require('path');
app.use(express.static(path.join(__dirname, '..')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Carwash Portal API running on port ${PORT}`);
});
