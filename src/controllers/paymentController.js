const Payment = require('../models/Payment');

exports.list = async (_req, res, next) => {
  try {
    const payments = await Payment.findAll();
    res.json(payments);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const payment = await Payment.create(req.body);
    res.status(201).json(payment);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const payment = await Payment.update(req.params.id, req.body);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Payment.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Payment not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.byBooking = async (req, res, next) => {
  try {
    const payments = await Payment.findByBooking(req.params.bookingId);
    res.json(payments);
  } catch (err) { next(err); }
};
