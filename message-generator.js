const AlreadySentFilter = require('./already-sent-filter');
const AlertZoneArea = require('./alert-zone-area');
const AffectedUsers = require('./affected-users');

class MessageGenerator {
  constructor(alerts, db, sentAlertIDs) {
    this.alerts = alerts
    this.db = db
    this.sentAlertIDs = sentAlertIDs
  }

  async generateMessages() {
    const filtered = new AlreadySentFilter(this.alerts.features, this.sentAlertIDs).getAlerts().slice(0, 150)
    const firebase_messages = []
    const promises = []
    for (const al of filtered) {
      this.sentAlertIDs.push(al.properties.id)
      promises.push(this._getMessages(al).then(messages => firebase_messages.push(messages)))
    }
    return Promise.all(promises).then(() => {
      console.log('Parsed', filtered.length, 'alerts')
      return firebase_messages
    })
  }

  async _getMessages(al) {
    return new AlertZoneArea(al).getPolygons()
      .then(alertZoneArea => new AffectedUsers(alertZoneArea).get())
      .then(users => console.log(al.properties.event, users))
  }
}

module.exports = MessageGenerator
