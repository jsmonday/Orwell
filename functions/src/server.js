const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: false }))
   .use('/reads', require('./lib/reads/route'))
   .get('*', (_, res) => res.status(404)
                            .json({ success: false, data: 'Endpoint not found' }))

module.exports = app;