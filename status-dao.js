const ListTrim = require('./list-trim')

class StatusDao {
  constructor(db) {
    this.db = db;
    this.statusRef = this.db.collection('functionstatus').doc('alertsync')
  }

  async saveStatusToDatabase(lastModified, sentAlertIDs) {
    return this.statusRef.update({
      lastModified: lastModified,
      sentAlertIDs: new ListTrim(sentAlertIDs, 1500, 500).getTrimmed()
    });
  }

  async getStatusFromDatabase() {
    return this.statusRef.get().then(status => this._setStatus(status))
  }

  _setStatus(status) {
    const data = status.data();
    this.lastModified = data.lastModified
    this.sentAlertIDs = data.sentAlertIDs
  }

  getLastModified() {
    return this.lastModified
  }

  getSentAlertIDs() {
    return this.sentAlertIDs
  }
}

module.exports = StatusDao
