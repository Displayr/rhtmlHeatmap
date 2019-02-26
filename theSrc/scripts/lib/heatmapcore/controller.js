import _ from 'lodash'
import { CellNames } from './layout'

const {
  LEFT_COLUMN,
  RIGHT_COLUMN,
  TOP_XAXIS,
  BOTTOM_XAXIS,
  LEFT_YAXIS,
  RIGHT_YAXIS,
  COLORMAP,
  TOP_DENDROGRAM,
  LEFT_DENDROGRAM
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
  get top_dendrogram () { return this.components[TOP_DENDROGRAM] }
  get left_dendrogram () { return this.components[LEFT_DENDROGRAM] }

  addComponents (components) {
    this.components = components
  }

  addOuter (outer) {
    this.outer = outer
    this.outer.on('click', () => {
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

    if (this.outer) {
      this.outer.classed('highlighting', this.isAnythingHighlighted())
      this.outer.classed('row-highlighting', this.isRowHighlighted())
      this.outer.classed('column-highlighting', this.isColumnHighlighted())
    }
  }

  columnCellClick (rowIndex) {
    if (this.isRowHighlighted(rowIndex)) {
      this.clearHighlightedRow(rowIndex)
    } else {
      this.highlightRow(rowIndex)
    }
    this.updateHighlights()
  }

  xaxisClick (index) {
    if (this.isColumnHighlighted(index)) {
      this.clearHighlightedColumn(index)
    } else {
      this.highlightColumn(index)
    }
    this.updateHighlights()
  }

  yaxisClick (index) {
    if (this.isRowHighlighted(index)) {
      this.clearHighlightedRow(index)
    } else {
      this.highlightRow(index)
    }
    this.updateHighlights()
  }

  colormapCellClick (rowIndex, columnIndex) {
    if (this.isAnythingHighlighted()) {
      this.clearHighlightedColumn()
      this.clearHighlightedRow()
      this.updateHighlights()
    }
  }

  colormapDragReset ({scale, translate, extent}) {
    if (this.colormap) { this.colormap.updateZoom({scale, translate, extent, zoom: false}) }
    if (this.xaxis) { this.xaxis.updateZoom({scale, translate, extent, zoom: false}) }
    if (this.yaxis) { this.yaxis.updateZoom({scale, translate, extent, zoom: false}) }
    if (this.leftColumn) { this.leftColumn.updateZoom({scale, translate, extent, zoom: false}) }
    if (this.rightColumn) { this.rightColumn.updateZoom({scale, translate, extent, zoom: false}) }
    if (this.left_dendrogram) { this.left_dendrogram.updateZoom({scale, translate, extent, zoom: false}) }
    if (this.top_dendrogram) { this.top_dendrogram.updateZoom({scale, translate, extent, zoom: false}) }

    if (this.outer) {
      this.outer.classed('zoomed', false)
    }
  }

  colormapDragSelection ({scale, translate, extent}) {
    if (this.colormap) { this.colormap.updateZoom({scale, translate, extent, zoom: true}) }
    if (this.xaxis) { this.xaxis.updateZoom({scale, translate, extent, zoom: true}) }
    if (this.yaxis) { this.yaxis.updateZoom({scale, translate, extent, zoom: true}) }
    if (this.leftColumn) { this.leftColumn.updateZoom({scale, translate, extent, zoom: true}) }
    if (this.rightColumn) { this.rightColumn.updateZoom({scale, translate, extent, zoom: true}) }
    if (this.left_dendrogram) { this.left_dendrogram.updateZoom({scale, translate, extent, zoom: true}) }
    if (this.top_dendrogram) { this.top_dendrogram.updateZoom({scale, translate, extent, zoom: true}) }

    if (this.outer) {
      this.outer.classed('zoomed', true)
    }
  }
}

module.exports = Controller
