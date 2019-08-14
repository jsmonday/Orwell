const router = require('express').Router();
const controller = require('./controller')

router.get('/update',     controller.updateArticleReads);
router.get('/:articleId', controller.getArticleReads);

module.exports = router