import _ from 'lodash'
import { CellNames } from './layout'

const {
  LEFT_COLUMN,
  RIGHT_COLUMN,
  TOP_XAXIS,
  BOTTOM_XAXIS,
  LEFT_YAXIS,
  RIGHT_YAXIS,
  COLORMAP
} = CellNames

class Controller {
  constructor () {
    this.state = {
      highlighted: {
        row: null,
        column: null
      }
    }
  }

  get colormap () { return this.components[COLORMAP] }
  get xaxis () { return this.components[TOP_XAXIS] || this.components[BOTTOM_XAXIS] }
  get yaxis () { return this.components[LEFT_YAXIS] || this.components[RIGHT_YAXIS] }
  get leftColumn () { return this.components[LEFT_COLUMN] }
  get rightColumn () { return this.components[RIGHT_COLUMN] }

  highlight (x, y) {
    console.warn('DEPRECATED: controller.highlight')
  }

  datapoint_hover (_) { // eslint-disable-line camelcase
    console.warn('DEPRECATED: controller.datapoint_hover')
  }

  on (evt, callback) {
    console.warn('DEPRECATED: controller.on')
  }

  transform (_) {
    console.warn('DEPRECATED: controller.tranform')
  }

  addComponents (components) {
    this.components = components
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

  isRowHighlighted (index = null) {
    return (_.isNull(index))
      ? !_.isNull(this.state.highlighted.row)
      : this.state.highlighted.row === parseInt(index)
  }

  highlightRow (index) {
    this.state.highlighted.row = parseInt(index)
  }

  clearHighlightedRow () {
    this.state.highlighted.row = null
  }

  isColumnHighlighted (index = null) {
    return (_.isNull(index))
      ? !_.isNull(this.state.highlighted.column)
      : this.state.highlighted.column === parseInt(index)
  }

  highlightColumn (index) {
    this.state.highlighted.column = parseInt(index)
  }

  clearHighlightedColumn () {
    this.state.highlighted.column = null
  }

  isAnythingHighlighted () {
    return !_.isNull(this.state.highlighted.row) || !_.isNull(this.state.highlighted.column)
  }

  updateHighlights () {
    if (this.colormap) { this.colormap.updateHighlights(this.state.highlighted) }
    if (this.xaxis) { this.xaxis.updateHighlights(this.state.highlighted) }
    if (this.yaxis) { this.yaxis.updateHighlights(this.state.highlighted) }
    if (this.leftColumn) { this.leftColumn.updateHighlights(this.state.highlighted) }
    if (this.rightColumn) { this.rightColumn.updateHighlights(this.state.highlighted) }
    // TODO clean this up
    if (this.outer) {
      this.outer.classed('highlighting', this.isAnythingHighlighted())
      this.outer.classed('row-highlighting', this.isRowHighlighted())
      this.outer.classed('column-highlighting', this.isColumnHighlighted())
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
    if (this.colormap) { this.colormap.updateZoom({scale, translate, extent}) }
    if (this.xaxis) { this.xaxis.updateZoom({scale, translate, extent}) }
  }

  colormapDragSelection ({scale, translate, extent}) {
    console.log('colormapDragSelection')
    if (this.colormap) { this.colormap.updateZoom({scale, translate, extent}) }
    if (this.xaxis) { this.xaxis.updateZoom({scale, translate, extent}) }
  }
}

module.exports = Controller
