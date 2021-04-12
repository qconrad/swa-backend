const MessageDataPayload = require('./message-data-payload')

class MessageGenerator {
  constructor(alert_user_map) {
    this.alert_user_map = alert_user_map
  }

  getMessages() {
    let messages = []
    for (const map of this.alert_user_map)
      for (const user of map.users)
        messages.push({priority: "high", token: user.token, data: new MessageDataPayload(map.alert).get()})
    return messages
  }
}

module.exports = MessageGenerator
