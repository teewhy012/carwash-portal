const Service = require('../models/Service');

exports.list = async (_req, res, next) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (err) { next(err); }
};

exports.listActive = async (_req, res, next) => {
  try {
    const services = await Service.findActive();
    res.json(services);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const service = await Service.update(req.params.id, req.body);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Service.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Service not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};
