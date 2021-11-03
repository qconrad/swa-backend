const functions = require('firebase-functions')
const admin = require("firebase-admin")
const serviceAccount = require("./serviceAccountKey.json")
const UserDao = require('./user-dao')
const StatusDao = require('./status-dao')
const AlertFetcher = require('./alert-fetcher')
const AlertParser = require('./alert-parser');
const AlertLogger = require('./alert-logger');
const MessageGenerator = require('./message-generator')
const MessageSplitter = require('./message-splitter')
const NestedCancelRemover = require('./nested-cancellation-remover')
const UserSyncValidator = require('./user-sync-validator')
const DuplicateLocationBugFixer = require('./duplicate-location-bug-fixer')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://severe-weather-alerts.firebaseio.com"
});

const USER_AGENT = '(Severe Weather Alerts, https://github.com/qconrad/severe-weather-alerts)';
const db = admin.firestore();

// Called when user makes request to sync their location(s)
// Validates request and updates database
exports.usersync = functions.https.onRequest((req, res) => {
  req.body.locations = new DuplicateLocationBugFixer(req.body.locations).fix()
  if (!UserSyncValidator.validate(req, res)) return;
  new UserDao(admin).addToDatabase(req.body)
    .then(() => { return res.status(200).send() })
    .catch(() => { return res.status(500).send() })
});

exports.feedback = functions.https.onRequest((req, res) => {
  let data = req.body
  data.createdAt = admin.firestore.Timestamp.now()
  db.collection("feedback").add(data).then(() => { return res.status(200).send()})
  .catch(() => res.status(500).send() )
})

// Send new alerts to affected users every minute
exports.alertssync = functions.pubsub.schedule('* * * * *') .onRun(() => syncAlerts())

const statusDao = new StatusDao(db)
let lastModified
let sentAlertIDs

function statusInCache() { return lastModified }

async function sendAndLog(alert_user_map) {
  new AlertLogger(alert_user_map, new Date()).log()
  return sendMessages(new MessageGenerator(alert_user_map).getMessages())
}

async function syncAlerts() {
  if (!statusInCache()) await statusDao.getStatusFromDatabase().then(() => setGlobalVariables(statusDao))
  const alertFetcher = new AlertFetcher(lastModified, USER_AGENT)
  return alertFetcher.fetchAlerts()
    .then(alerts => new AlertParser(alerts, db, sentAlertIDs).parseAlerts())
    .then(alert_user_map => sendAndLog(new NestedCancelRemover(alert_user_map).get()))
    .then(() => lastModified = alertFetcher.getLastModified())
    .then(() => statusDao.saveStatusToDatabase(lastModified, sentAlertIDs))
    .catch(error => console.log(error.message))
    .finally(() => console.log("Alert Sync Complete"))
}

async function deleteTokens(failedTokens) {
  if (failedTokens.length <= 0) return
  let promises = []
  const userDao = new UserDao(admin)
  for (const token of failedTokens)
    promises.push(userDao.deleteToken(token))
  return Promise.all(promises)
}

async function sendMessages(messages) {
  let promises = []
  if (messages.length < 1) return
  let payloads = new MessageSplitter(messages, 500).getPayloads()
  for (const payload of payloads)
    promises.push(admin.messaging().sendAll(payload).then(response => parseResponse(messages, response)).then(invalidTokens => deleteTokens(invalidTokens)))
  return Promise.all(promises)
}

function parseResponse(messages, messageSendResponse) {
  console.log('Send complete. Success:', messageSendResponse.successCount, 'Failures:', messageSendResponse.failureCount)
  let invalidTokens = []
  if (messageSendResponse.failureCount > 0) {
    messageSendResponse.responses.forEach(function (response, i) {
      if (response.error) {
        if (response.error.code === 'messaging/registration-token-not-registered'||
            response.error.code === 'messaing/invalid-argument') {
          invalidTokens.push(messages[i].token)
        }
        else console.log(response.error.message)
      }
    });
  }
  return invalidTokens
}

function setGlobalVariables(statusDao) {
  lastModified = statusDao.getLastModified()
  sentAlertIDs = statusDao.getSentAlertIDs()
}
