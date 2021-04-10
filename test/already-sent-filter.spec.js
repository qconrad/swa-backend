const AlreadySentFilter = require('../already-sent-filter.js')

test('alerts given, returns alert json',  () => {
  let alerts = [{properties: {id: 'test'}}];
  let sentAlertIDs = ['test2'];
  let alreadySentFilter = new AlreadySentFilter(alerts, sentAlertIDs)
  expect(alreadySentFilter.getAlerts()[0].properties.id).toBe('test')
});

test('different alerts given, returns alert json',  () => {
  let alerts = [{properties: { id: 'test 2'}}];
  let sentAlertIDs = ['test 2'];
  let alreadySentFilter = new AlreadySentFilter(alerts, sentAlertIDs)
  expect(alreadySentFilter.getAlerts().length).toBe(0)
});

test('two alerts given, one filtered out',  () => {
  let alerts = [{properties: { id: 'test 1'}},{properties: { id: 'test 2'}}];
  let sentAlertIDs = ['test 2'];
  let alreadySentFilter = new AlreadySentFilter(alerts, sentAlertIDs)
  expect(alreadySentFilter.getAlerts().length).toBe(1)
});