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

async function updatePatronEvents(req, res) {

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
            startDate: moment().format("YYYY-MM-DD"),
            endDate:   moment().format("YYYY-MM-DD")
          }
        ],
        metrics: [
          {
            expression: 'ga:totalEvents'
          }
        ],
        dimensions: [
          {
            name: 'ga:eventCategory'
          },
          {
            name: 'ga:eventAction'
          },
          {
            name: 'ga:eventLabel'
          }
        ],
        dimensionFilterClauses: [{
            filters: [
              {
                dimensionName: "ga:eventCategory",
                operator: "EXACT",
                expressions: ["patron"]
              }
            ]
          }]
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

    let documents = {};

    for (const row of rows) {

      const event    = row.dimensions[1];
      const patron   = row.dimensions[2];
      const value    = row.metrics[0].values[0]; 

      if (patron !== "(not set)") {
        
        if (!documents[patron]) {
          documents[patron] = { [event]: parseInt(value) }
        }
        else {
          documents[patron][event] = parseInt(value)
        }
        
      }
    }

    for (const doc in documents) {

      // eslint-disable-next-line no-await-in-loop
      await analytics.doc("events").collection(doc).doc(currentCollection).set(documents[doc])
      console.log(`Updated patron ${doc}:`, documents[doc]);
    }

    res.json(documents);

  } catch (err) {
    console.log(err);
    res.status(err.code).json(err);
  }
}

async function getPatronEvents(req, res) {

  if (!req.query || req.query.token !== process.env.UPDATE_TOKEN) {
    console.log("Unauthorized request. Aborting.");
    return res.status(401).json({ success: false, data: 'Invalid token' });
  }

  try {
    
    let docs = [];

    const snapshot = await analytics.doc("events").collection(req.params.patron).get()

    snapshot.forEach(doc => docs.push({ [doc.id]: doc.data() }));

    res.json(docs);

  } catch (err) {
    console.log(err);
    res.json({error: "f**k"});
  }

}

module.exports = {
  updatePatronEvents,
  getPatronEvents
}