const _ = require('lodash')

const wrapInPromiseAndLogErrors = function (fn) {
  return new Promise((resolve, reject) => {
    fn().then(resolve)
      .catch((err) => {
        console.log(err)
        reject(err)
      })
  }).catch((err) => {
    console.log(err)
    throw err
  })
}

module.exports = function () {
  this.When(/^I hover over cell ([0-9]+)x([0-9]+)$/, function (rowIndex, columnIndex) {
    return wrapInPromiseAndLogErrors(() => {
      return browser.actions()
        .mouseMove(this.context.heatmapPlot.cell(rowIndex, columnIndex))
        .perform()
    })
  })

  this.When(/^I click on cell ([0-9]+)x([0-9]+)$/, function (rowIndex, columnIndex) {
    return wrapInPromiseAndLogErrors(() => {
      return browser.actions()
        .mouseMove(this.context.heatmapPlot.cell(rowIndex, columnIndex))
        .mouseDown()
        .mouseUp()
        .perform()
    })
  })

  // NB this moves to approx. correct area +/- 5 pixels. I have not bothered with math to make this exact (didn't need it)
  // NB appears mouseMouve will only accept small increments, so I need to repeatedly call it
  this.When(/^I hover over cell ([0-9]+)x([0-9]+) with offset ([0-9-]+)x([0-9-]+)$/, function (rowIndex, columnIndex, xOffset, yOffset) {
    return wrapInPromiseAndLogErrors(() => {
      const offsets = { x: parseInt(xOffset), y: parseInt(yOffset) }
      const maxStepSize = 5
      const numSteps = Math.max(Math.abs(Math.ceil(offsets.x / maxStepSize)), Math.abs(Math.ceil(offsets.y / maxStepSize)))
      const stepSize = { x: Math.ceil(offsets.x / numSteps), y: Math.ceil(offsets.y / numSteps) }

      const actionsMoveToCell = browser.actions().mouseMove(this.context.heatmapPlot.cell(rowIndex, columnIndex))
      const actionsWithMove = _.reduce(_.range(numSteps), (actionChain) => actionChain.mouseMove(stepSize), actionsMoveToCell)

      return actionsWithMove.perform()
    })
  })

  this.When(/^I zoom from ([0-9]+)x([0-9]+) to ([0-9]+)x([0-9]+)$/, function (cellOneRowIndex, cellOneColumnIndex, cellTwoRowIndex, cellTwoColumnIndex) {
    return wrapInPromiseAndLogErrors(() => {
      return browser.actions()
        .mouseMove(this.context.heatmapPlot.cell(cellOneRowIndex, cellOneColumnIndex))
        .mouseDown()
        .mouseMove(this.context.heatmapPlot.cell(cellTwoRowIndex, cellTwoColumnIndex))
        .mouseUp()
        .perform()
    })
  })

  this.When(/^I click row ([0-9]+) name$/, function (rowIndex) {
    return wrapInPromiseAndLogErrors(() => {
      return this.context.heatmapPlot.rowName(rowIndex).click()
    })
  })
}
