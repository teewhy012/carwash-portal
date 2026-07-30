const Booking = require('../models/Booking');

exports.list = async (_req, res, next) => {
  try {
    const bookings = await Booking.findAll();
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const booking = await Booking.create(req.body);
    const full = await Booking.findById(booking.id);
    res.status(201).json(full);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const booking = await Booking.update(req.params.id, req.body);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const full = await Booking.findById(booking.id);
    res.json(full);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const booking = await Booking.updateStatus(req.params.id, req.body.status);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Booking.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Booking not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.byDate = async (req, res, next) => {
  try {
    const bookings = await Booking.findByDate(req.params.date);
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.byCustomer = async (req, res, next) => {
  try {
    const bookings = await Booking.findByCustomer(req.params.customerId);
    res.json(bookings);
  } catch (err) { next(err); }
};
