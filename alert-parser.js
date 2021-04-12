const AlreadySentFilter = require('./already-sent-filter')
const AlertZoneArea = require('./alert-zone-area')
const AffectedUsers = require('./affected-users')

class AlertParser {
  constructor(alerts, db, sentAlertIDs) {
    this.alerts = alerts
    this.db = db
    this.sentAlertIDs = sentAlertIDs
  }

  async parseAlerts() {
    const filtered = new AlreadySentFilter(this.alerts.features, this.sentAlertIDs).getAlerts().slice(0, 150)
    const userList = []
    const promises = []
    for (const al of filtered) {
      this.sentAlertIDs.push(al.properties.id)
      promises.push(this._getAffectedUsers(al).then(users => this._addAlertIfHasUsers(al, users, userList)))
    }
    return Promise.all(promises).then(() => {
      console.log('Parsed', filtered.length, 'alerts')
      return userList
    })
  }

  _addAlertIfHasUsers(al, users, userList) {
    if (users.length > 0) userList.push({alert: al, users: users})
  }

  async _getAffectedUsers(al) {
    return new AlertZoneArea(al).getPolygons().then(alertZoneArea => new AffectedUsers(alertZoneArea, this.db).get())
  }
}

module.exports = AlertParser