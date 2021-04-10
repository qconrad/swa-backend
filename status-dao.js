class StatusDao {
  constructor(db) {
    this.db = db;
    this.statusRef = this.db.collection('functionstatus').doc('alertsync')
  }

  async saveStatusToDatabase(lastModified, sentAlertIDs) {
    return this.statusRef.update({
      lastModified: lastModified,
      sentAlertIDs: sentAlertIDs
    });
  }

  async fetchData() {
    const status = await this.statusRef.get();
    let data = status.data();
    this.lastModified = data.lastModified
    this.sentAlertIDs = data.sentAlertIDs
  }
  k
  getLastModified() {
    return this.lastModified
  }

  getSentAlertIDs() {
    return this.sentAlertIDs
  }
}
module.exports = StatusDao
