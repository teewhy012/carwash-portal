const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');

exports.list = async (_req, res, next) => {
  try {
    const customers = await Customer.findAll();
    res.json(customers);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const customer = await Customer.update(req.params.id, req.body);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Customer.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Customer not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.vehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findByCustomer(req.params.id);
    res.json(vehicles);
  } catch (err) { next(err); }
};
