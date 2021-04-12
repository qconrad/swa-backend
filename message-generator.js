const AlreadySentFilter = require('./already-sent-filter');
const PolygonListBounds = require('./polygon-list-bounds');
const BoundCenter = require('./bound-center');
const AlertPolygons = require('./alert-polygons');
const InsidePolygonList = require('./inside-polygon-list');
const geofire = require('geofire-common');

class MessageGenerator {
  constructor(alerts, db, sentAlertIDs) {
    this.alerts = alerts
    this.db = db
    this.sentAlertIDs = sentAlertIDs
  }

  async generateMessages() {
    let filtered = new AlreadySentFilter(this.alerts.features, this.sentAlertIDs).getAlerts().slice(0, 150)
    let firebase_messages = []
    let promises = []
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
    return this._getAlertZoneArea(al)
      .then(alertZoneArea => this._getAffectedUsers(alertZoneArea))
      .then(users => console.log(al.properties.event, users))
  }

  async _getAlertZoneArea(al) {
    return new AlertPolygons(al).getPolygons()
  }

  async _getAffectedUsers(polygonList) {
    return this._queryNearbyUsers(polygonList).then(snapshots => {
      const affectedUsers = []
      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          let user = doc.data()
          if (new InsidePolygonList(polygonList, [user.coordinate.latitude, user.coordinate.longitude]).isInside())
            affectedUsers.push(user)
        }
      }
      return affectedUsers
    })
  }

  async _queryNearbyUsers(polygonList) {
    let zoneBounds = new PolygonListBounds(polygonList).getBounds()
    let center = new BoundCenter(zoneBounds).getCenter()
    const radiusM = (geofire.distanceBetween(center, [zoneBounds[0], zoneBounds[3]])) * 1000
    const queryBounds = geofire.geohashQueryBounds(center, radiusM)
    let promises = []
    for (const b of queryBounds) {
      promises.push(this.db.collection('locations')
        .orderBy('geohash')
        .startAt(b[0])
        .endAt(b[1]).get())
    }
    return Promise.all(promises)
  }
}

module.exports = MessageGenerator
