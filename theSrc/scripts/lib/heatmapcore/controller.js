import _ from 'lodash'

class Controller {
  constructor () {
    this.state = {
      highlighted: {
        row: null,
        column: null
      }
    }
  }

  highlight (x, y) {
    console.log('DEPRECATED: controller.highlight')
  }

  datapoint_hover (_) { // eslint-disable-line camelcase
    console.log('DEPRECATED: controller.datapoint_hover')
  }

  on (evt, callback) {
    console.log('DEPRECATED: controller.on')
  }

  transform (_) {
    console.log('DEPRECATED: controller.tranform')
  }

  addColorMap (colormap) {
    this.colormap = colormap
  }

  addOuter (outer) {
    this.outer = outer
    this.outer.on('click', () => {
      console.log('outer anything clicked')
      if (this.isAnythingHighlighted()) {
        this.clearHighlightedColumn()
        this.clearHighlightedRow()
        this.updateHighlights()
      }
    })
  }

  isRowHighlighted (index) {
    return this.state.highlighted.row === parseInt(index)
  }

  highlightRow (index) {
    this.state.highlighted.row = parseInt(index)
  }

  clearHighlightedRow (index) {
    this.state.highlighted.row = null
  }

  isColumnHighlighted (index) {
    return this.state.highlighted.column === parseInt(index)
  }

  highlightColumn (index) {
    this.state.highlighted.column = parseInt(index)
  }

  clearHighlightedColumn (index) {
    this.state.highlighted.column = null
  }

  isAnythingHighlighted () {
    return !_.isNull(this.state.highlighted.row) || !_.isNull(this.state.highlighted.column)
  }

  updateHighlights () {
    if (this.colormap) {
      this.colormap.updateHighlights({
        rowIndex: this.state.highlighted.row,
        columnIndex: this.state.highlighted.column,
      })
    }
    // TODO clean this up
    if (this.outer) {
      this.outer.classed('highlighting', this.isAnythingHighlighted())
    }
  }

  columnCellClick (rowIndex) {
    console.log(`columnCellClick(${rowIndex})`)
    if (this.isRowHighlighted(rowIndex)) {
      this.clearHighlightedRow(rowIndex)
    } else {
      this.highlightRow(rowIndex)
    }
    this.updateHighlights()
  }

  xaxisClick (index) {
    console.log(`xaxisClick(${index})`)
    if (this.isColumnHighlighted(index)) {
      this.clearHighlightedColumn(index)
    } else {
      this.highlightColumn(index)
    }
    this.updateHighlights()
  }

  yaxisClick (index) {
    console.log(`yaxisClick(${index})`)
    if (this.isRowHighlighted(index)) {
      this.clearHighlightedRow(index)
    } else {
      this.highlightRow(index)
    }
    this.updateHighlights()
  }

  colormapCellClick (rowIndex, columnIndex) {
    console.log(`colormapCellClick(${rowIndex}, ${columnIndex})`)
    if (this.isAnythingHighlighted()) {
      this.clearHighlightedColumn()
      this.clearHighlightedRow()
      this.updateHighlights()
    }
  }

  colormapDragReset ({scale, translate, extent}) {
    console.log('colormapDragReset')
    this.colormap.updateZoom({scale, translate, extent})
  }

  colormapDragSelection ({scale, translate, extent}) {
    console.log('colormapDragSelection')
    this.colormap.updateZoom({scale, translate, extent})
  }
}

module.exports = Controller
