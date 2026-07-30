const Employee = require('../models/Employee');

exports.list = async (_req, res, next) => {
  try {
    const employees = await Employee.findAll();
    res.json(employees);
  } catch (err) { next(err); }
};

exports.listActive = async (_req, res, next) => {
  try {
    const employees = await Employee.findActive();
    res.json(employees);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const employee = await Employee.update(req.params.id, req.body);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Employee.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Employee not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};
