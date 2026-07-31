const PosDocument = require('../models/PosDocument');

exports.snapshot = async (_req, res, next) => {
  try {
    const docs = await PosDocument.findAll();
    const snapshot = {};
    docs.forEach((d) => {
      if (!snapshot[d.doc_type]) snapshot[d.doc_type] = [];
      snapshot[d.doc_type].push(d.payload);
    });
    res.json(snapshot);
  } catch (err) { next(err); }
};

exports.sync = async (req, res, next) => {
  try {
    const { docs } = req.body || {};
    if (!Array.isArray(docs) || docs.length === 0) {
      return res.status(400).json({ error: 'docs array is required' });
    }
    const results = [];
    for (const doc of docs) {
      const { doc_type: docType, doc_key: docKey, payload } = doc;
      if (!docType || !docKey) {
        return res.status(400).json({ error: 'Each doc needs doc_type and doc_key' });
      }
      const saved = await PosDocument.upsert(docType, docKey, payload || {});
      results.push(saved);
    }
    res.json({ synced: results.length });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await PosDocument.remove(req.params.docType, req.params.docKey);
    if (!deleted) return res.status(404).json({ error: 'Document not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};
