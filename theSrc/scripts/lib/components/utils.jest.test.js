const Utils = require('./utils.js')

test('fontSizeInPx', () => {
  expect(Utils.fontSizeInPx(10)).toEqual('10px')
})
