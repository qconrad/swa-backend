class AlreadySentFilter {
  constructor(alerts, sentAlertIDs) {
    this.alerts = alerts
    this.sentAlertIDs = sentAlertIDs
    this.alerts = alerts.filter(item => !sentAlertIDs.includes(item.properties.id));
  }

  getAlerts() {
    return this.alerts
  }
}

module.exports = AlreadySentFilter
