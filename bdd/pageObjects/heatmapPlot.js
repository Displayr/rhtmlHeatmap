class HeatmapPlot {
  cell (row, col) {
    return element(by.css(`rect[data-index="${row}x${col}"]`))
  }

  rowName (rowIndex) {
    // the axis are auto gen by D3 so I cannot easily add classes to simplify this.
    // On plus side, the expression will not change unless we upgrade d3
    return element(by.css(`.axis.yaxis .axis-text:nth-child(${rowIndex})`))
  }
}

module.exports = HeatmapPlot
