class HeatmapPlot {
  cell (row, col) {
    return element(by.css(`rect[data-index="${row}x${col}"]`))
  }

  rowName (rowIndex) {
    return element(by.css(`.yaxis-label.tick-${rowIndex} text`))
  }

  columnName (columnIndex) {
    return element(by.css(`.xaxis-label.tick-${columnIndex} text`))
  }

  legendBars () {
    return element(by.css(`.legendBars`))
  }
}

module.exports = HeatmapPlot
