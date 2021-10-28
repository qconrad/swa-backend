/**
 * There is a bug in older versions of the app that causes duplicate locations.
 * This class is used to filter out those duplicate locations while still
 * alowing the user to sync their first location.
 */
class DuplicateLocationBugFixer {
  constructor(locations) {
    this.locations = locations;
  }

  fix() {
    if (this.locations.length > 2 && !this._locationsDifferent(this.locations[1], this.locations[2])) {
      return this.locations.slice(0,1);
    }
    return this.locations
  }

  _locationsDifferent(location1, location2) {
    return location1[0] !== location2[0] || location1[1] !== location2[1];
  }
}

module.exports = DuplicateLocationBugFixer;