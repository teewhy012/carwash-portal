const { Router } = require('express');
const ctrl = require('../controllers/paymentController');

const router = Router();

router.get('/', ctrl.list);
router.get('/booking/:bookingId', ctrl.byBooking);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
