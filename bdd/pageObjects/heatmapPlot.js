class HeatmapPlot {
  cell (row, col) {
    return element(by.css(`rect[data-index="${row}x${col}"]`))
  }
}

module.exports = HeatmapPlot
