const PolygonListBounds = require('./polygon-list-bounds');
const BoundCenter = require('./bound-center');
const InsidePolygonList = require('./inside-polygon-list');
const geofire = require('geofire-common');

class AffectedUsers {
  constructor(polygonList, db) {
    this.polygonList = polygonList
    this.db = db
  }

  async get() {
    return this._queryNearbyUsers().then(snapshots => {
      const affectedUsers = []
      for (const snap of snapshots) {
        for (const doc of snap.docs) {
          const user = doc.data()
          if (new InsidePolygonList(this.polygonList, [user.coordinate.latitude, user.coordinate.longitude]).isInside())
            affectedUsers.push(user)
        }
      }
      return affectedUsers
    })
  }

  async _queryNearbyUsers() {
    const zoneBounds = new PolygonListBounds(this.polygonList).getBounds()
    const center = new BoundCenter(zoneBounds).getCenter()
    const radiusM = (geofire.distanceBetween(center, [zoneBounds[0], zoneBounds[3]])) * 1000
    const queryBounds = geofire.geohashQueryBounds(center, radiusM)
    const promises = []
    for (const b of queryBounds) {
      promises.push(this.db.collection('locations')
        .orderBy('geohash')
        .startAt(b[0])
        .endAt(b[1]).get())
    }
    return Promise.all(promises)
  }
}

module.exports = AffectedUsers
