class HeatmapPlot {
  cell (row, col) {
    return element(by.css(`rect[data-index="${row}x${col}"]`))
  }

  rowName (rowIndex) {
    return element(by.css(`.axis.yaxis .axis-text.tick-${rowIndex}`))
  }

  columnName (columnIndex) {
    return element(by.css(`.axis.xaxis .axis-text.tick-${columnIndex}`))
  }

  legendBars () {
    return element(by.css(`.legendBars`))
  }
}

module.exports = HeatmapPlot
