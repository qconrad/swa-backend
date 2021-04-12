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
      promises.push(this._getUsers(al).then(users => userList.push(users)))
    }
    return Promise.all(promises).then(() => {
      console.log('Parsed', filtered.length, 'alerts')
      return userList
    })
  }

  async _getUsers(al) {
    return new AlertZoneArea(al).getPolygons()
      .then(alertZoneArea => new AffectedUsers(alertZoneArea, db).get())
      .then(users => { return { alert: al, users: users } })
  }
}

module.exports = AlertParser
