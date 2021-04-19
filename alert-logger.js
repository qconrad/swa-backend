class AlertLogger {
  constructor(alerts, date) {
    this.alerts = alerts
    this.date = date
  }

  log() {
    for (const alert of this.alerts) {
      let latency = (this.date - new Date(alert.alert.properties.sent)) / 1000
      let latencyMinutes = Math.floor(latency / 60)
      console.log("Latency: <" + latencyMinutes + "min, " + alert.alert.properties.event + " " + alert.alert.properties.messageType + " by " + this.alerts[0].alert.properties.senderName + ", users: [" + alert.users + "]")
    }
  }
}

module.exports = AlertLogger
