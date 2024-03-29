const MessageDataPayload = require('./message-data-payload')

class MessageGenerator {
  constructor(alert_user_map) {
    this.alert_user_map = alert_user_map
  }

  getMessages() {
    const messages = []
    for (const alertMap of this.alert_user_map) {
      for (const user of alertMap.users) {
        let dataPayload = new MessageDataPayload(alertMap.alert).get()
        let message = { android: { priority: "high" }, token: user.token, data: dataPayload }
        if (JSON.stringify(message).length > 4000) message.data = { fetchManually: "true", id: dataPayload.id }
        message.data.locationIndex = user.index + ""
        messages.push(message)
      }
    }
    return messages
  }
}

module.exports = MessageGenerator
