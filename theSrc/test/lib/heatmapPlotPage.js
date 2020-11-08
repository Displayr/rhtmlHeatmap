
class HeatmapPlotPage {
  constructor (page) {
    this.page = page
  }

  cellSelector (row, col) { return `rect[data-index="${row}x${col}"]` }

  rowNameSelector (row) { return `.yaxis-label.tick-${row} text` }

  columnNameSelector (col) { return `.xaxis-label.tick-${col} text` }

  legendBarsSelector () { return `.legendBars` }

  async clickCell (row, col) { return this.page.click(this.cellSelector(row,col)) }

  async hoverCell (row, col) { return this.page.hover(this.cellSelector(row,col)) }

  async clickRowName (row) { return this.page.click(this.rowNameSelector(row)) }

  async clickColumnName (col) { return this.page.click(this.columnNameSelector(col)) }

  async clickLegendBar () { return this.page.click(this.legendBarsSelector()) }

  async zoom (sourceCellRow,sourceCellCol,targetCellRow,targetCellCol) {
    const getCoords = async (selector) => {
      const element = await this.page.$(selector);
      const rect = await this.page.evaluate(element => {
        const {top, left, bottom, right} = element.getBoundingClientRect()
        return {top, left, bottom, right}
      }, element);
      return rect
    }

    const targetCoords = await getCoords(this.cellSelector(targetCellRow, targetCellCol))

    await this.hoverCell(sourceCellRow, sourceCellCol)
    await this.page.mouse.down()
    await this.page.mouse.move(targetCoords.left + 25, targetCoords.top + 25, {steps: 50})
    await this.page.mouse.up()
  }
}

module.exports = HeatmapPlotPage
