const router     = require('express').Router();
const controller = require('./controller')

router.get('/update',  controller.updatePatronEvents);
// router.get('/:patron', controller.getPatronEvents);

module.exports = router