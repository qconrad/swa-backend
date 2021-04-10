const geofire = require("geofire-common");

class UserDao {
  #userSyncJson;
  #admin;
  #db;

  constructor(firebaseAdmin, userSyncJson) {
    this.#userSyncJson = userSyncJson;
    this.#admin = firebaseAdmin;
    this.#db = firebaseAdmin.firestore();
  }

  async addToDatabase() {
    let promises = [];
    const userLocations = await this.#db.collection('locations').where('token', '==', this.#userSyncJson.token).get();
    if (userLocations.empty) {
      promises.push(this.#deleteTokenFromRealtimeDatabase(this.#userSyncJson.token));
      promises.push(this.#addNewUser(this.#userSyncJson.token, this.#userSyncJson.locations[0][0], this.#userSyncJson.locations[0][1]))
      console.log('New user:', this.#userSyncJson.token)
    }
    userLocations.forEach(location => {
      promises.push(this.#updateExistingLocation(location, this.#userSyncJson.locations[0][0], this.#userSyncJson.locations[0][1]));
      console.log('Location update:', this.#userSyncJson.token)
    });
    return Promise.all(promises);
  }

  async #addNewUser(token, lat, lon) {
    return this.#db.collection('locations').add({
      token: token,
      index: 0,
      coordinate: new this.#admin.firestore.GeoPoint(lat, lon),
      geohash: geofire.geohashForLocation([lat, lon])
    });
  }

  async #updateExistingLocation(locationDoc, lat, lon) {
    return locationDoc.ref.update({
      coordinate: new this.#admin.firestore.GeoPoint(lat, lon),
      geohash: geofire.geohashForLocation([lat, lon])
    })
  }

  async #deleteTokenFromRealtimeDatabase(token) {
    console.log("Deleting token from realtime database: " + token);
    return this.#admin.database().ref("/users/" + token).remove();
  }
}
module.exports = UserDao

