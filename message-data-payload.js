class MessageDataPayload {
  constructor(alert) {
    this.alert = alert
  }

  get() {
    let props = this.alert.properties
    let data = {}
    data.name = props.event
    data.id = props.id
    if (props.parameters.NWSheadline) data.nwsHeadline = props.parameters.NWSheadline[0]
    data.description = props.description
    if (props.instruction && props.messageType !== "Cancel") data.instruction = props.instruction
    data.type = props.messageType
    data.sent = props.sent
    if (props.onset) data.onset = props.onset
    if (props.expires) data.expires = props.expires
    if (props.ends) data.ends = props.ends
    if (props.senderName) data.senderName = props.senderName
    data.senderCode = props.parameters.PIL[0].slice(0, 3)
    if (this.alert.geometry) {
      data.polygonType = this.alert.geometry.type
      data.polygon = JSON.stringify(this.alert.geometry.coordinates)
    } else {
      let zones = []
      for (const zone of props.affectedZones) zones.push(zone.substring((30)))
      data.zones = JSON.stringify(zones)
    }
    return data
  }
}

module.exports = MessageDataPayload
