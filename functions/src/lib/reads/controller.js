const { google }    = require('googleapis');
const moment        = require('moment');
const account       = require('../keys/keys.json');
const strapi        = require('../strapi');
const { analytics } = require('../firebase')
                      require('dotenv').config();

const reporting = google.analyticsreporting('v4');
const view_id   = process.env.GA_ID;
const scopes    = ['https://www.googleapis.com/auth/analytics.readonly'];
const jwt       = new google.auth.JWT(
  account.client_email, 
  null, 
  account.private_key, 
  scopes
);

async function updateArticleReads(req, res) {

  if (!req.query || req.query.token !== process.env.UPDATE_TOKEN) {
    console.log("Unauthorized request. Aborting.");
    return res.status(401).json({ success: false, data: 'Invalid token' });
  }

  const reports = {
    reportRequests: [
      {
        viewId: view_id,
        dateRanges: [
          {
            startDate: '2019-01-01', 
            endDate: 'today'
          }
        ],
        metrics: [
          {
            expression: 'ga:uniquePageViews'
          }, 
          {
            expression: 'ga:pageviews'
          },
          {
            expression: 'ga:timeOnPage'
          },
          {
            expression: 'ga:avgTimeOnPage'
          }
        ],
        dimensions: [
          {
            name: 'ga:pagePath'
          },
          {
            name: 'ga:fullReferrer'
          }
        ]
      }
    ]
  }

  try {

    await jwt.authorize();

    const data = await reporting.reports.batchGet({
      headers: { 'Content-Type': 'application/json' }, 
      auth: jwt, 
      resource: reports
    });

    const rows              = data.data.reports[0].data.rows;
    const currentCollection = moment().format('DD-MM-YYYY');
    const strapiJwt         = await strapi.getJWT();

    let changedUris = {};

    for (let row of rows) {
      const path = row.dimensions[0];
      // Get only articles
      if (/\/articles\/.*/.test(path)) {

        // Get only articles with correct url
        if (/\/articles\/\d*\/.+/.test(path)) {

          const docId    = row.dimensions[0].match(/\d{1,}/)[0];
          const referrer = row.dimensions[1]; 
          const doc = {
            date:            new Date(),
            uniquePageViews: parseInt(row.metrics[0].values[0]),
            totalPageViews:  parseInt(row.metrics[0].values[1]),
            timeOnPage:      parseFloat(row.metrics[0].values[2]),
            avgTimeOnPage:   parseFloat(row.metrics[0].values[3]),
            referrer
          }

          let reads = parseInt(row.metrics[0].values[1]);

          if (docId in changedUris) {
            changedUris[docId] += reads;
          } else {
            changedUris[docId] = reads
          }
        }

      }
    }

    for (let id in changedUris) {
      const docId = id;
      const reads = changedUris[id];

      // eslint-disable-next-line no-await-in-loop
      await Promise.all([
        // analytics.doc("articleReads").collection(currentCollection).doc(docId).set(doc),
        strapi.updateArticleReads(strapiJwt, docId, reads)
      ]);
    }

    res.json({
      success: true,
      data: 'Database and Strapi successfully updated'
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      data: err
    })
  }

}

async function getArticleReads(req, res) {

  if (!req.query || req.query.token !== process.env.UPDATE_TOKEN) {
    console.log("Unauthorized request. Aborting.");
    return res.status(401).json({ success: false, data: 'Invalid token' });
  }

  const date      = req.query.date || moment().format('DD-MM-YYYY');
  const articleId = req.params.articleId;

  try {

    const doc = await analytics.doc("articleReads").collection(date).doc(articleId).get();

    if (!doc.exists) {
      res.status(404).json({
        success: false,
        data: "Article does not exists"
      })
    }

    res.json({
      success: true,
      data: doc.data()
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      data: err
    })
  }

}

module.exports = {
  updateArticleReads,
  getArticleReads
}