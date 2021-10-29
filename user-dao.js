const geofire = require("geofire-common")

class UserDao {
  constructor(firebaseAdmin) {
    this.admin = firebaseAdmin
    this.locationsRef = firebaseAdmin.firestore().collection('locations')
  }

  async addToDatabase(userSyncJson) {
    return this._getLocations(userSyncJson.token).then(userLocations => this._addOrUpdate(userSyncJson, userLocations))
  }

  async _addOrUpdate(userSyncJson, locationsRef) {
    let promises = []
    let locations = []
    locationsRef.forEach(location => locations.push(location))
    for (let locIndex = 0; locIndex < Math.max(locations.length, userSyncJson.locations.length); locIndex++) {
      if (locIndex > userSyncJson.locations.length - 1) {
        console.log('Deleted location %d: %s', locIndex, userSyncJson.token)
        promises.push(locations[locIndex].ref.delete());
      }
      else if (userSyncJson.locations[locIndex] === null) continue;
      else if (locIndex > locations.length - 1) {
        console.log('Added new location at index %d: %s', locIndex, userSyncJson.token)
        promises.push(this._deleteTokenFromRealtimeDatabase(userSyncJson.token))
        promises.push(this._addNewLocation(userSyncJson.token, locIndex, userSyncJson.locations[locIndex][0], userSyncJson.locations[locIndex][1]))
      }
      else {
        console.log('Location update at index %d: %s', locIndex, userSyncJson.token)
        promises.push(this._updateExistingLocation(locations[locIndex], userSyncJson.locations[locIndex][0], userSyncJson.locations[locIndex][1]))
      }
    }
    return Promise.all(promises)
  }

  async _addNewLocation(token, index, lat, lon) {
    return this.locationsRef.add({
      token: token,
      index: index,
      coordinate: new this.admin.firestore.GeoPoint(lat, lon),
      geohash: geofire.geohashForLocation([lat, lon])
    })
  }

  async _updateExistingLocation(locationDoc, lat, lon) {
    return locationDoc.ref.update({
      coordinate: new this.admin.firestore.GeoPoint(lat, lon),
      geohash: geofire.geohashForLocation([lat, lon])
    })
  }

  async deleteToken(token) {
    return this._getLocations(token).then(userLocations => this._deleteLocations(userLocations, token))
  }

  async _getLocations(token) {
    return this.locationsRef.where('token', '==', token).orderBy('index').get();
  }

  async _deleteLocations(userLocations, token) {
    let deleteCount = 0
    let promises = []
    userLocations.forEach(location => {
      deleteCount++
      promises.push(location.ref.delete())
    })
    console.log('Deleted', deleteCount, 'location(s) for token: ', token)
    return Promise.all(promises)
  }

  async _deleteTokenFromRealtimeDatabase(token) {
    console.log("Deleting token from realtime database: " + token)
    return this.admin.database().ref("/users/" + token).remove()
  }
}
module.exports = UserDao

