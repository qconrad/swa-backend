const geofire = require("geofire-common");

class UserDao {
  constructor(firebaseAdmin) {
    this.admin = firebaseAdmin
    this.locationsRef = firebaseAdmin.firestore().collection('locations')
  }

  async addToDatabase(userSyncJson) {
    return this._getLocations(userSyncJson.token).then(userLocations => this._addOrUpdate(userSyncJson, userLocations))
  }

  async _addOrUpdate(userSyncJson, locations) {
    let promises = []
    if (locations.empty) {
      promises.push(this._deleteTokenFromRealtimeDatabase(userSyncJson.token));
      promises.push(this._addNewUser(userSyncJson.token, userSyncJson.locations[0][0], userSyncJson.locations[0][1]))
      console.log('New user:', userSyncJson.token)
    }
    locations.forEach(location => {
      promises.push(this.updateExistingLocation(location, userSyncJson.locations[0][0], userSyncJson.locations[0][1]));
      console.log('Location update:', userSyncJson.token)
    });
    return Promise.all(promises);
  }

  async _addNewUser(token, lat, lon) {
    return this.locationsRef.add({
      token: token,
      index: 0,
      coordinate: new this.admin.firestore.GeoPoint(lat, lon),
      geohash: geofire.geohashForLocation([lat, lon])
    });
  }

  async updateExistingLocation(locationDoc, lat, lon) {
    return locationDoc.ref.update({
      coordinate: new this.admin.firestore.GeoPoint(lat, lon),
      geohash: geofire.geohashForLocation([lat, lon])
    })
  }

  async deleteToken(token) {
    return this._getLocations(token).then(userLocations => this._deleteLocations(userLocations, token))
  }

  async _getLocations(token) {
    return this.locationsRef.where('token', '==', token).get()
  }

  _deleteLocations(userLocations, token) {
    let deleteCount = 0
    userLocations.forEach(location => {
      deleteCount++
      location.ref.delete()
    });
    console.log('Deleted', deleteCount, 'location(s) for token: ', token)
  }


  async _deleteTokenFromRealtimeDatabase(token) {
    console.log("Deleting token from realtime database: " + token);
    return this.admin.database().ref("/users/" + token).remove();
  }
}
module.exports = UserDao

