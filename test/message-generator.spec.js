const MessageGenerator = require('../message-generator')
let testAlert = {"id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-76.12,39.61],[-76.18,39.63],[-76.23,39.690000000000005],[-76.29,39.71000000000001],[-76.30000000000001,39.720000000000006],[-76.06000000000002,39.720000000000006],[-76.12,39.61]]]},"properties":{"@id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","@type":"wx:Alert","id":"urn:oid:2.49.0.1.840.0.8ba0cff30450afa127c317fe6f032f835c575b84.001.1","areaDesc":"Cecil, MD; Harford, MD","geocode":{"SAME":["024015","024025"],"UGC":["MDC015","MDC025"]},"affectedZones":["https://api.weather.gov/zones/county/MDC015","https://api.weather.gov/zones/county/MDC025"],"references":[{"@id":"https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.7244d49d9d4f2c894c2591559f21e9d0164e9a26.001.1","identifier":"urn:oid:2.49.0.1.840.0.7244d49d9d4f2c894c2591559f21e9d0164e9a26.001.1","sender":"w-nws.webmaster@noaa.gov","sent":"2021-04-11T21:16:00-04:00"}],"sent":"2021-04-11T21:40:00-04:00","effective":"2021-04-11T21:40:00-04:00","onset":"2021-04-11T21:40:00-04:00","expires":"2021-04-11T22:00:00-04:00","ends":"2021-04-11T22:00:00-04:00","status":"Actual","messageType":"Update","category":"Met","severity":"Severe","certainty":"Observed","urgency":"Immediate","event":"Severe Thunderstorm Warning","sender":"w-nws.webmaster@noaa.gov","senderName":"NWS Baltimore MD/Washington DC","headline":"Severe Thunderstorm Warning issued April 11 at 9:40PM EDT until April 11 at 10:00PM EDT by NWS Baltimore MD/Washington DC","description":"At 940 PM EDT, a severe thunderstorm was located over Conowingo, or 9\nmiles north of Havre De Grace, moving northeast at 10 mph.\n\nHAZARD...60 mph wind gusts and quarter size hail.\n\nSOURCE...Radar indicated.\n\nIMPACT...Damaging winds will cause some trees and large branches to\nfall. This could injure those outdoors, as well as damage\nhomes and vehicles. Roadways may become blocked by downed\ntrees. Localized power outages are possible. Unsecured\nlight objects may become projectiles.\n\nLocations impacted include...\nRising Sun, Rock Springs, Octoraro, Richardsmere and Conowingo.","instruction":"For your protection move to an interior room on the lowest floor of a\nbuilding.","response":"Shelter","parameters":{"PIL":["LWXSVSLWX"],"NWSheadline":["A SEVERE THUNDERSTORM WARNING REMAINS IN EFFECT UNTIL 1000 PM EDT FOR NORTHEASTERN HARFORD AND NORTHWESTERN CECIL COUNTIES"],"eventMotionDescription":["2021-04-12T01:40:00-00:00...storm...230DEG...10KT...39.68,-76.17"],"windGust":["60 MPH"],"hailSize":[1],"BLOCKCHANNEL":["EAS","NWEM","CMAS"],"EAS-ORG":["WXR"],"VTEC":["/O.CON.KLWX.SV.W.0013.000000T0000Z-210412T0200Z/"],"eventEndingTime":["2021-04-12T02:00:00+00:00"]}}}

test('no alerts given, no messages', () => {
  let messageGenerator = new MessageGenerator([])
  expect(messageGenerator.getMessages().length).toBe(0)
});

test('one alert with one user, one message returned', () => {
  let input = [{alert: testAlert, users: [{token: "test"}]}]
  let messageGenerator = new MessageGenerator(input)
  expect(messageGenerator.getMessages().length).toBe(1)
});

test('one alert with two user, two messages returned', () => {
  let input = [{alert: testAlert, users: [{token: "test"},{token: "test2"}]}]
  let messageGenerator = new MessageGenerator(input)
  expect(messageGenerator.getMessages().length).toBe(2)
});

test('one alert with two user, two messages returned', () => {
  let input = [{alert: testAlert, users: [{token: "test"},{token: "test2"}]}]
  let messageGenerator = new MessageGenerator(input)
  expect(messageGenerator.getMessages()[0].token).toBe("test")
});

test('one alert with two user, two messages returned', () => {
  let input = [{alert: testAlert, users: [{token: "test"},{token: "test2"}]}]
  let messageGenerator = new MessageGenerator(input)
  expect(messageGenerator.getMessages()[0].android.priority).toBe("high")
});

test('one alert with two user, data payload returned', () => {
  let input = [{alert: testAlert, users: [{token: "test"},{token: "test2"}]}]
  let messageGenerator = new MessageGenerator(input)
  expect(messageGenerator.getMessages()[0].data.name).toBe("Severe Thunderstorm Warning")
});