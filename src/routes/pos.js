const { Router } = require('express');
const ctrl = require('../controllers/posController');

const router = Router();

router.get('/snapshot', ctrl.snapshot);
router.post('/sync', ctrl.sync);
router.delete('/:docType/:docKey', ctrl.remove);

module.exports = router;
