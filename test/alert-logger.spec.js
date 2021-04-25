const AlertLogger = require('../alert-logger.js')

test('alerts given, logs first alert', () => {
  console.log = jest.fn();
  let alerts = [{alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Severe Thunderstorm Warning", messageType: "Update", senderName: "NWS Chicago IL"}}, users: [{token:"userid"}]}];
  new AlertLogger(alerts, new Date("2021-04-19T14:36:00-06:00")).log()
  expect(console.log.mock.calls[0][0]).toBe('Latency: <1min, Severe Thunderstorm Warning Update by NWS Chicago IL, 1 user(s): [userid]');
});

test('alerts given, logs different alert name', () => {
  console.log = jest.fn();
  let alerts = [{alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Severe Thunderstorm Watch", messageType: "Update", senderName: "NWS Chicago IL"}}, users: [{token:"userid"}]}];
  new AlertLogger(alerts, new Date("2021-04-19T14:36:00-06:00")).log()
  expect(console.log.mock.calls[0][0]).toBe('Latency: <1min, Severe Thunderstorm Watch Update by NWS Chicago IL, 1 user(s): [userid]');
});

test('alerts given, logs different type', () => {
  console.log = jest.fn();
  let alerts = [{alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Severe Thunderstorm Watch", messageType: "Alert", senderName: "NWS Chicago IL"}}, users: [{token:"userid"}]}];
  new AlertLogger(alerts, new Date("2021-04-19T14:36:00-06:00")).log()
  expect(console.log.mock.calls[0][0]).toBe('Latency: <1min, Severe Thunderstorm Watch Alert by NWS Chicago IL, 1 user(s): [userid]');
});

test('alerts given, logs different type', () => {
  console.log = jest.fn();
  let alerts = [{alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Severe Thunderstorm Watch", messageType: "Alert", senderName: "NWS Lincoln IL"}}, users: [{token:"userid"}]}];
  new AlertLogger(alerts, new Date("2021-04-19T14:36:00-06:00")).log()
  expect(console.log.mock.calls[0][0]).toBe('Latency: <1min, Severe Thunderstorm Watch Alert by NWS Lincoln IL, 1 user(s): [userid]');
});

test('alerts given, two user ids', () => {
  console.log = jest.fn();
  let alerts = [{alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Severe Thunderstorm Watch", messageType: "Alert", senderName: "NWS Lincoln IL"}}, users: [{token: "userid"}, {token:"userid2"}]}];
  new AlertLogger(alerts, new Date("2021-04-19T14:36:00-06:00")).log()
  expect(console.log.mock.calls[0][0]).toBe('Latency: <1min, Severe Thunderstorm Watch Alert by NWS Lincoln IL, 2 user(s): [userid,userid2]');
});

test('alerts given, different latency', () => {
  console.log = jest.fn();
  let alerts = [{alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Severe Thunderstorm Watch", messageType: "Alert", senderName: "NWS Lincoln IL"}}, users: [{token: "userid"}, {token:"userid2"}]}];
  new AlertLogger(alerts, new Date("2021-04-19T14:37:00-06:00")).log()
  expect(console.log.mock.calls[0][0]).toBe('Latency: <2min, Severe Thunderstorm Watch Alert by NWS Lincoln IL, 2 user(s): [userid,userid2]');
});

test('alerts given, logs two alerts', () => {
  console.log = jest.fn();
  let alerts = [{alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Severe Thunderstorm Watch", messageType: "Alert", senderName: "NWS Lincoln IL"}}, users: ["userid", "userid2"]},
                {alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Tornado Warning", messageType: "Alert", senderName: "NWS Lincoln IL"}}, users: [{token:"userid"}, {token:"userid2"}]}];
  new AlertLogger(alerts, new Date("2021-04-19T14:37:00-06:00")).log()
  expect(console.log.mock.calls[1][0]).toBe('Latency: <2min, Tornado Warning Alert by NWS Lincoln IL, 2 user(s): [userid,userid2]');
});

test('alerts given, user token printed', () => {
  console.log = jest.fn();
  let alerts = [{alert: {properties: {sent: "2021-04-19T14:35:00-06:00", event: "Tornado Warning", messageType: "Alert", senderName: "NWS Lincoln IL"}}, users: [{token: "userid"}, {token:"userid2"}]}]
  new AlertLogger(alerts, new Date("2021-04-19T14:37:00-06:00")).log()
  expect(console.log.mock.calls[0][0]).toBe('Latency: <2min, Tornado Warning Alert by NWS Lincoln IL, 2 user(s): [userid,userid2]');
});
