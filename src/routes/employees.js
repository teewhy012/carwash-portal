const { Router } = require('express');
const ctrl = require('../controllers/employeeController');

const router = Router();

router.get('/', ctrl.list);
router.get('/active', ctrl.listActive);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
