class MessageSplitter {
  constructor(messages, splitBy) {
    this.messages = messages
    this.splitBy = splitBy
  }

  getPayloads() {
    let payloadList = []
    this.addSplitPayloads(payloadList)
    payloadList.push(this.messages)
    return payloadList
  }

  addSplitPayloads(payloadList) {
    while (this.messages.length > this.splitBy)
      payloadList.push(this.messages.splice(0, this.splitBy))
  }
}

module.exports = MessageSplitter