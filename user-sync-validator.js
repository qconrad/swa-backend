const MAX_LOCATIONS = 10;

class UserSyncValidator {
  static validate(req, res) {
    if (this._tooManyLocations(req.body.locations)) {
      res.status(400).send('Too many locations')
      return false
    }
    return true
  }

  static _tooManyLocations(locations) {
    return locations.length > MAX_LOCATIONS
  }

}

module.exports = UserSyncValidator;
