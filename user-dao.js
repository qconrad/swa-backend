const geofire = require("geofire-common");

class UserDao {
  #userSyncJson;

  constructor(userSyncJson) {
    this.#userSyncJson = userSyncJson;
  }

  async addToDatabase() {
    let promises = [];
    const userLocations = await db.collection('locations').where('token', '==', syncJson.token).get();

    if (userLocations.empty) {
      promises.push(deleteTokenFromRealtimeDatabase(syncJson.token));
      promises.push(UserDao.#addNewUser(syncJson.token, syncJson.locations[0][0], syncJson.locations[0][1]))
      console.log('New user:', syncJson.token)
    }
    userLocations.forEach(location => {
      promises.push(UserDao.#updateExistingLocation(location, syncJson.locations[0][0], syncJson.locations[0][1]));
      console.log('Location update:', syncJson.token)
    });
    return Promise.all(promises);
  }

  static async #addNewUser(token, lat, lon) {
    return db.collection('locations').add({
      token: token,
      index: 0,
      coordinate: new admin.firestore.GeoPoint(lat, lon),
      geohash: geofire.geohashForLocation([lat, lon])
    });
  }

  static async #updateExistingLocation(locationDoc, lat, lon) {
    return locationDoc.ref.update({
      coordinate: new admin.firestore.GeoPoint(lat, lon),
      geohash: geofire.geohashForLocation([lat, lon])
    })
  }
}
module.exports = UserDao

