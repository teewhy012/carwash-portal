const { Router } = require('express');
const ctrl = require('../controllers/bookingController');

const router = Router();

router.get('/', ctrl.list);
router.get('/date/:date', ctrl.byDate);
router.get('/customer/:customerId', ctrl.byCustomer);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.updateStatus);
router.delete('/:id', ctrl.remove);

module.exports = router;
