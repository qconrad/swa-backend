const MessageSplitter = require('../message-splitter.js')

test('split size greater than messages, original array returned',  () => {
  let messages = [{key: "value"},{key: "value"}];
  let messageSplitter = new MessageSplitter(messages, 5)
  expect(messageSplitter.getPayloads().length).toBe(1)
});

test('split size smaller than messages, messages split',  () => {
  let messages = [{key: "value"},{key: "value"}];
  let messageSplitter = new MessageSplitter(messages, 1)
  expect(messageSplitter.getPayloads().length).toBe(2)
});

test('first array value correct',  () => {
  let messages = [{key: "value1"},{key: "value2"}];
  let messageSplitter = new MessageSplitter(messages, 1)
  expect(messageSplitter.getPayloads()[0][0].key).toBe("value1")
});

test('split size smaller than messages, messages split',  () => {
  let messages = [{key: "value1"},{key: "value2"}];
  let messageSplitter = new MessageSplitter(messages, 1)
  expect(messageSplitter.getPayloads()[1][0].key).toBe("value2")
});