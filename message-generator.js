const MessageDataPayload = require('./message-data-payload')

class MessageGenerator {
  constructor(alert_user_map) {
    this.alert_user_map = alert_user_map
  }

  getMessages() {
    let messages = []
    for (const alertMap of this.alert_user_map) {
      for (const user of alertMap.users)
        messages.push({android: {priority: "high"}, token: user.token, data: new MessageDataPayload(alertMap.alert).get()})
    }
    return messages
  }
}

module.exports = MessageGenerator
