import BaseComponent from './baseComponent'
import _ from 'lodash'
import Column from './column'

const horizontalAlignmentMap = {
  l: 'left',
  c: 'center',
  r: 'right'
}

class ColumnGroup extends BaseComponent {
  constructor ({ parentContainer, classNames, labelMatrix = [[]], alignments = [], fontSize, fontColor, fontFamily, padding = 0, maxSingleColumnWidth, maxHeight }) {
    super()
    _.assign(this, { parentContainer, classNames, labelMatrix, alignments, fontSize, fontColor, fontFamily, padding, maxSingleColumnWidth, maxHeight })

    // to deal with superflous zoom calls at beginning of render
    this.amIZoomed = false
    this.rowCount = this.labelMatrix[0].length // NB assume same number of rows in each column

    this.columns = this.labelMatrix.map((columnLabels, i) => {
      return new Column({
        parentContainer: this.parentContainer,
        classNames: `${this.classNames} column-${i}`,
        labels: columnLabels,
        horizontalAlignment: horizontalAlignmentMap[this.alignments[i]],
        fontSize: this.fontSize,
        fontColor: this.fontColor,
        fontFamily: this.fontFamily,
        maxWidth: this.maxSingleColumnWidth,
        maxHeight: this.maxHeight
      })
    })
  }

  setController (controller) {
    this.controller = controller
    this.columns.map(column => column.setController(controller))
  }

  getColumnWidths () {
    return this.columnWidths
  }

  computePreferredDimensions () {
    const preferredColumnDimensions = this.columns.map(column => column.computePreferredDimensions())
    this.columnWidths = _(preferredColumnDimensions).map('width').value() // NB I take the "preferred" here and then use it as actual
    return {
      width: _(preferredColumnDimensions).map('width').sum() + this.padding * this.columns.length - 1,
      height: 0 // accept what height we are given
    }
  }

  draw (columnGroupBounds) {
    // TODO If columnGroupBounds.width < sum(this.columnWidths), Then I need to shrink the column widths
    this.bounds = columnGroupBounds
    let cumulativeWidth = 0
    this.selections = []
    this.columnWidths.forEach((individualWidth, columnIndex) => {
      const columnBounds = {
        top: columnGroupBounds.top,
        left: columnGroupBounds.left + cumulativeWidth,
        width: individualWidth,
        height: columnGroupBounds.height
      }
      cumulativeWidth += individualWidth + this.padding
      this.columns[columnIndex].draw(columnBounds)
    })
  }

  updateHighlights ({ row = null } = {}) {
    this.columns.forEach(column => column.updateHighlights({ row }))
  }

  updateZoom ({ scale, translate, extent, zoom }) {
    if (!zoom && !this.amIZoomed) {
      return
    }
    if (zoom && this.amIZoomed) {
      return
    }
    this.amIZoomed = zoom
    if (this.amIZoomed) {
      return this.applyZoom({ scale, translate, extent })
    } else {
      return this.resetZoom()
    }
  }

  applyZoom ({ scale, translate, extent }) {
    this.columns.forEach(column => column.applyZoom({ scale, translate, extent }))
  }

  resetZoom () {
    this.columns.forEach(column => column.resetZoom())
  }
}

module.exports = ColumnGroup
