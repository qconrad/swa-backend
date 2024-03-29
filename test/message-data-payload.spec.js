const MessageDataPayload = require('../message-data-payload')
let testAlert = {"id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-76.12,39.61],[-76.18,39.63],[-76.23,39.690000000000005],[-76.29,39.71000000000001],[-76.30000000000001,39.720000000000006],[-76.06000000000002,39.720000000000006],[-76.12,39.61]]]},"properties":{"@id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","@type":"wx:Alert","id":"urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","areaDesc":"Cecil, MD; Harford, MD","geocode":{"SAME":["024015","024025"],"UGC":["MDC015","MDC025"]},"affectedZones":["https://api.weather.gov/zones/county/MDC015","https://api.weather.gov/zones/county/MDC025"],"references":[{"@id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.7244d49d9d4f2c894c2591559f21e9d0164e9a26.001.1","identifier":"urn:oid:2.49.0.1.840.0.7244d49d9d4f2c894c2591559f21e9d0164e9a26.001.1","sender":"w-nws.webmaster@noaa.gov","sent":"2021-04-11T21:16:00-04:00"}],"sent":"2021-04-11T21:40:00-04:00","effective":"2021-04-11T21:40:00-04:00","onset":"2021-04-11T21:40:00-04:00","expires":"2021-04-11T22:00:00-04:00","ends":"2021-04-11T22:00:00-04:00","status":"Actual","messageType":"Update","category":"Met","severity":"Severe","certainty":"Observed","urgency":"Immediate","event":"Severe Thunderstorm Warning","sender":"w-nws.webmaster@noaa.gov","senderName":"NWS Baltimore MD/Washington DC","headline":"Severe Thunderstorm Warning issued April 11 at 9:40PM EDT until April 11 at 10:00PM EDT by NWS Baltimore MD/Washington DC","description":"At 940 PM EDT, a severe thunderstorm was located over Conowingo, or 9\nmiles north of Havre De Grace, moving northeast at 10 mph.\n\nHAZARD...60 mph wind gusts and quarter size hail.\n\nSOURCE...Radar indicated.\n\nIMPACT...Damaging winds will cause some trees and large branches to\nfall. This could injure those outdoors, as well as damage\nhomes and vehicles. Roadways may become blocked by downed\ntrees. Localized power outages are possible. Unsecured\nlight objects may become projectiles.\n\nLocations impacted include...\nRising Sun, Rock Springs, Octoraro, Richardsmere and Conowingo.","instruction":"For your protection move to an interior room on the lowest floor of a\nbuilding.","response":"Shelter","parameters":{"PIL":["LWXSVSLWX"],"NWSheadline":["A SEVERE THUNDERSTORM WARNING REMAINS IN EFFECT UNTIL 1000 PM EDT FOR NORTHEASTERN HARFORD AND NORTHWESTERN CECIL COUNTIES"],"eventMotionDescription":["2021-04-12T01:40:00-00:00...storm...230DEG...10KT...39.68,-76.17"],"windGust":["60 MPH"],"hailSize":[1],"BLOCKCHANNEL":["EAS","NWEM","CMAS"],"EAS-ORG":["WXR"],"VTEC":["/O.CON.KLWX.SV.W.0013.000000T0000Z-210412T0200Z/"],"eventEndingTime":["2021-04-12T02:00:00+00:00"]}}}

test('alert properties given, returns event name', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().name).toBe("Severe Thunderstorm Warning")
});

test('alert properties given, returns different event name', () => {
  testAlert.properties.event = "Tornado Warning"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().name).toBe("Tornado Warning")
});

test('alert properties given, returns id', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().id).toBe("urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1")
});

test('alert properties given, returns different id', () => {
  testAlert.properties.id = "different id"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().id).toBe("different id")
});

test('alert properties given, returns nws headline', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().nwsHeadline).toBe("A SEVERE THUNDERSTORM WARNING REMAINS IN EFFECT UNTIL 1000 PM EDT FOR NORTHEASTERN HARFORD AND NORTHWESTERN CECIL COUNTIES")
});

test('alert properties given, returns different nws headline', () => {
  testAlert.properties.parameters.NWSheadline[0] = "different headline"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().nwsHeadline).toBe("different headline")
});

test('alert properties given, nws headline undefined', () => {
  delete testAlert.properties.parameters.NWSheadline
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().nwsHeadline).toBe(undefined)
});

test('alert properties given, returns nws headline', () => {
  delete testAlert.properties.parameters.NWSheadline
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().nwsHeadline).toBe(undefined)
});

test('alert properties given, returns description', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().description).toBe("At 940 PM EDT, a severe thunderstorm was located over Conowingo, or 9\nmiles north of Havre De Grace, moving northeast at 10 mph.\n\nHAZARD...60 mph wind gusts and quarter size hail.\n\nSOURCE...Radar indicated.\n\nIMPACT...Damaging winds will cause some trees and large branches to\nfall. This could injure those outdoors, as well as damage\nhomes and vehicles. Roadways may become blocked by downed\ntrees. Localized power outages are possible. Unsecured\nlight objects may become projectiles.\n\nLocations impacted include...\nRising Sun, Rock Springs, Octoraro, Richardsmere and Conowingo.")
});

test('alert properties given, returns different description', () => {
  testAlert.properties.description = "different description"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().description).toBe("different description")
});

test('alert properties given, returns instruction', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().instruction).toBe("For your protection move to an interior room on the lowest floor of a\nbuilding.")
});

test('alert properties given, returns different instruction', () => {
  testAlert.properties.instruction = "different instruction"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().instruction).toBe("different instruction")
});

test('alert properties given, instruction undefined', () => {
  testAlert.properties.instruction = null
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().instruction).toBe(undefined)
});

test('alert properties given, type returned', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().type).toBe("Update")
});

test('alert properties given, different type returned', () => {
  testAlert.properties.messageType = "Cancel"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().type).toBe("Cancel")
});

test('alert properties given, sent returned', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().sent).toBe("2021-04-11T21:40:00-04:00")
});

test('alert properties given, different sent returned', () => {
  testAlert.properties.sent = "test"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().sent).toBe("test")
});

test('alert properties given, onset returned', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().onset).toBe("2021-04-11T21:40:00-04:00")
});

test('alert properties given, different onset returned', () => {
  testAlert.properties.onset = "test"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().onset).toBe("test")
});

test('alert properties given, onset undefined', () => {
  testAlert.properties.onset = null
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().onset).toBe(undefined)
});

test('alert properties given, expires returned', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().expires).toBe("2021-04-11T22:00:00-04:00")
});

test('alert properties given, different expires returned', () => {
  testAlert.properties.expires = "test"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().expires).toBe("test")
});

test('alert properties given, expires undefined', () => {
  testAlert.properties.expires = null
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().expires).toBe(undefined)
});

test('alert properties given, ends returned', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().ends).toBe("2021-04-11T22:00:00-04:00")
});

test('alert properties given, different ends returned', () => {
  testAlert.properties.ends = "test"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().ends).toBe("test")
});

test('alert properties given, ends returned', () => {
  testAlert.properties.ends = null
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().ends).toBe(undefined)
});

test('alert properties given, sender name returned', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().senderName).toBe("NWS Baltimore MD/Washington DC")
});

test('alert properties given, different sender name returned', () => {
  testAlert.properties.senderName = "test"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().senderName).toBe("test")
});

test('alert properties given, sender name undefined', () => {
  testAlert.properties.senderName = null
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().senderName).toBe(undefined)
});

test('alert properties given, sender code returned', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().senderCode).toBe("LWX")
});

test('alert properties given, different sender code returned', () => {
  testAlert.properties.parameters.PIL[0] = "LOTSIOEA"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().senderCode).toBe("LOT")
});

test('alert properties given, polygon type returned', () => {
  testAlert.geometry.type = "MultiPolygon"
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().polygonType).toBe("MultiPolygon")
});

test('alert properties given, polygon returned', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().polygon).toBe("[[[-76.12,39.61],[-76.18,39.63],[-76.23,39.690000000000005],[-76.29,39.71000000000001],[-76.30000000000001,39.720000000000006],[-76.06000000000002,39.720000000000006],[-76.12,39.61]]]")
});

test('alert properties given, geometry given, zones undefined', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().zones).toBe(undefined)
});

test('alert properties given, polygon type undefined', () => {
  testAlert.geometry = null
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().polygonType).toBe(undefined)
});

test('alert properties given, geometry null, zones given', () => {
  testAlert.geometry = null
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().zones).toBe("[\"county/MDC015\",\"county/MDC025\"]")
});

test('cancel with instruction, instruction undefined', () => {
  let testAlert = {"id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-76.12,39.61],[-76.18,39.63],[-76.23,39.690000000000005],[-76.29,39.71000000000001],[-76.30000000000001,39.720000000000006],[-76.06000000000002,39.720000000000006],[-76.12,39.61]]]},"properties":{"@id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","@type":"wx:Alert","id":"urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","areaDesc":"Cecil, MD; Harford, MD","geocode":{"SAME":["024015","024025"],"UGC":["MDC015","MDC025"]},"affectedZones":["https://api.weather.gov/zones/county/MDC015","https://api.weather.gov/zones/county/MDC025"],"references":[{"@id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.7244d49d9d4f2c894c2591559f21e9d0164e9a26.001.1","identifier":"urn:oid:2.49.0.1.840.0.7244d49d9d4f2c894c2591559f21e9d0164e9a26.001.1","sender":"w-nws.webmaster@noaa.gov","sent":"2021-04-11T21:16:00-04:00"}],"sent":"2021-04-11T21:40:00-04:00","effective":"2021-04-11T21:40:00-04:00","onset":"2021-04-11T21:40:00-04:00","expires":"2021-04-11T22:00:00-04:00","ends":"2021-04-11T22:00:00-04:00","status":"Actual","messageType":"Cancel","category":"Met","severity":"Severe","certainty":"Observed","urgency":"Immediate","event":"Severe Thunderstorm Warning","sender":"w-nws.webmaster@noaa.gov","senderName":"NWS Baltimore MD/Washington DC","headline":"Severe Thunderstorm Warning issued April 11 at 9:40PM EDT until April 11 at 10:00PM EDT by NWS Baltimore MD/Washington DC","description":"At 940 PM EDT, a severe thunderstorm was located over Conowingo, or 9\nmiles north of Havre De Grace, moving northeast at 10 mph.\n\nHAZARD...60 mph wind gusts and quarter size hail.\n\nSOURCE...Radar indicated.\n\nIMPACT...Damaging winds will cause some trees and large branches to\nfall. This could injure those outdoors, as well as damage\nhomes and vehicles. Roadways may become blocked by downed\ntrees. Localized power outages are possible. Unsecured\nlight objects may become projectiles.\n\nLocations impacted include...\nRising Sun, Rock Springs, Octoraro, Richardsmere and Conowingo.","instruction":"For your protection move to an interior room on the lowest floor of a\nbuilding.","response":"Shelter","parameters":{"PIL":["LWXSVSLWX"],"NWSheadline":["A SEVERE THUNDERSTORM WARNING REMAINS IN EFFECT UNTIL 1000 PM EDT FOR NORTHEASTERN HARFORD AND NORTHWESTERN CECIL COUNTIES"],"eventMotionDescription":["2021-04-12T01:40:00-00:00...storm...230DEG...10KT...39.68,-76.17"],"windGust":["60 MPH"],"hailSize":[1],"BLOCKCHANNEL":["EAS","NWEM","CMAS"],"EAS-ORG":["WXR"],"VTEC":["/O.CON.KLWX.SV.W.0013.000000T0000Z-210412T0200Z/"],"eventEndingTime":["2021-04-12T02:00:00+00:00"]}}}
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().instruction).toBe(undefined)
});

test('event motion description', () => {
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().motionDescription).toBe("2021-04-12T01:40:00-00:00...storm...230DEG...10KT...39.68,-76.17")
});

let noPIL = {"id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.f2b9e8dae4814a9f6d19c82d7bb9e78ddf95b8ed.003.2","type":"Feature","geometry":null,"properties":{"@id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.f2b9e8dae4814a9f6d19c82d7bb9e78ddf95b8ed.003.2","@type":"wx:Alert","id":"urn:oid:2.49.0.1.840.0.f2b9e8dae4814a9f6d19c82d7bb9e78ddf95b8ed.003.2","areaDesc":"Southeast Suffolk","geocode":{"SAME":["036103"],"UGC":["NYZ081"]},"affectedZones":["https://api.weather.gov/zones/forecast/NYZ081"],"references":[],"sent":"2021-11-03T15:23:00-04:00","effective":"2021-11-03T15:23:00-04:00","onset":"2021-11-04T00:00:00-04:00","expires":"2021-11-04T05:00:00-04:00","ends":"2021-11-04T09:00:00-04:00","status":"Actual","messageType":"Alert","category":"Met","severity":"Minor","certainty":"Likely","urgency":"Expected","event":"Frost Advisory","sender":"w-nws.webmaster@noaa.gov","senderName":"NWS Upton NY","headline":"Frost Advisory issued November 3 at 3:23PM EDT until November 4 at 9:00AM EDT by NWS Upton NY","description":"* WHAT...Temperatures as low as the upper 20s to lower 30s will\nresult in frost formation.\n\n* WHERE...Southeast Suffolk County.\n\n* WHEN...From midnight tonight to 9 AM EDT Thursday.\n\n* IMPACTS...Frost could kill sensitive outdoor vegetation if\nleft uncovered.","instruction":"Take steps now to protect tender plants from the cold.","response":"Prepare","parameters":{"AWIPSidentifier":["NPWOKX"],"WMOidentifier":["WWUS71 KOKX 031923"],"NWSheadline":["FROST ADVISORY IN EFFECT FROM MIDNIGHT TONIGHT TO 9 AM EDT THURSDAY"],"BLOCKCHANNEL":["EAS","NWEM","CMAS"],"VTEC":["/O.EXB.KOKX.FR.Y.0002.211104T0400Z-211104T1300Z/"],"eventEndingTime":["2021-11-04T13:00:00+00:00"]}}}

test('alert without PIL field provided, sender code correct', () => {
  let messageData = new MessageDataPayload(noPIL)
  expect(messageData.get().senderCode).toBe("OKX")
});

test('description null, description undefined', () => {
  testAlert.properties.description = null
  let messageData = new MessageDataPayload(testAlert)
  expect(messageData.get().description).toBe(undefined)
});