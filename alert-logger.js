class AlertLogger {
  constructor(alerts, date) {
    this.alerts = alerts
    this.date = date
  }

  log() {
    for (const alert of this.alerts) {
      let latency = (this.date - new Date(alert.alert.properties.sent)) / 1000
      let latencyMinutes = Math.floor(latency / 60)
      let users = []
      let alProp = alert.alert.properties;
      for (const user of alert.users) users.push(user.token)
      console.log("Latency: <" + latencyMinutes + "min, " + alProp.event + " " + alProp.messageType + " by " + alProp.senderName + ", " + users.length + " user(s): [" + users + "]")
    }
  }
}

module.exports = AlertLogger
