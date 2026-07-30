const Vehicle = require('../models/Vehicle');

exports.list = async (_req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll();
    res.json(vehicles);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.update(req.params.id, req.body);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Vehicle.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};
