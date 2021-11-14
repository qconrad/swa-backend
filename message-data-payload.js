class MessageDataPayload {
  constructor(alert) {
    this.alert = alert
  }

  _getSenderCode(props) {
    if (props.parameters.PIL)
      return props.parameters.PIL[0].slice(0, 3)
     else
      return props.parameters.WMOidentifier[0].slice(8, 11)
  }

  get() {
    let props = this.alert.properties
    let data = {}
    data.name = props.event
    data.id = props.id
    if (props.parameters.NWSheadline) data.nwsHeadline = props.parameters.NWSheadline[0]
    if (props.description) data.description = props.description
    if (props.instruction && props.messageType !== "Cancel") data.instruction = props.instruction
    data.type = props.messageType
    data.sent = props.sent
    if (props.onset) data.onset = props.onset
    if (props.expires) data.expires = props.expires
    if (props.ends) data.ends = props.ends
    if (props.senderName) data.senderName = props.senderName
    if (props.parameters.eventMotionDescription) data.motionDescription = props.parameters.eventMotionDescription[0]
    data.senderCode = this._getSenderCode(props)
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
