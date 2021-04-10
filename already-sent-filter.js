class AlreadySentFilter {
  constructor(alerts, sentAlertIDs) {
    this.alerts = alerts
    this.sentAlertIDs = sentAlertIDs
    this.filterAlerts();
  }

  getAlerts() {
    return this.alerts
  }

  filterAlerts() {
    for (let i = 0; i < this.alerts.length; i++) if (this.alreadySent(i)) this.removeFromList(i);
  }

  removeFromList(i) {
    this.alerts = this.alerts.splice(i, i)
  }

  alreadySent(i) {
    return this.sentAlertIDs.includes(this.alerts[i].properties.id);
  }
}

module.exports = AlreadySentFilter
