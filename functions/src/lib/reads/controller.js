const { google }    = require('googleapis');
const moment        = require('moment');
const account       = require('../keys/keys.json');
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

async function getArticleReads(req, res) {

  if (!req.body.token) 
    return res.status(401).json({ success: false, data: 'Missing required token' });

  if (req.body.token !== process.env.UPDATE_TOKEN) 
    return res.status(401).json({ success: false, data: 'Invalid token' });

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

    const rows = data.data.reports[0].data.rows;
    const currentCollection = moment().format('DD-MM-YYYY');

    for (let row of rows) {
      const docId    = row.dimensions[0].match(/\d*$/)[0];
      const referrer = row.dimensions[1]; 
      const doc = {
        date:            new Date(),
        uniquePageViews: parseInt(row.metrics[0].values[0]),
        totalPageViews:  parseInt(row.metrics[0].values[1]),
        timeOnPage:      parseFloat(row.metrics[0].values[2]),
        avgTimeOnPage:      parseFloat(row.metrics[0].values[3]),
        referrer
      }
      
      if (/^\/articles\/.*/.test(row.dimensions[0])) {
        console.log(JSON.stringify(row, null, 2))
        // eslint-disable-next-line no-await-in-loop
        await analytics.doc("articleReads").collection(currentCollection).doc(docId).set(doc)
      }
    }

    res.json({
      success: true,
      data: 'Database successfully updated'
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      data: err
    })
  }

}

module.exports = {
  getArticleReads
}