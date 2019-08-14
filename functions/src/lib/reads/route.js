const router = require('express').Router();
const controller = require('./controller')

router.post('/update', controller.getArticleReads);

module.exports = router