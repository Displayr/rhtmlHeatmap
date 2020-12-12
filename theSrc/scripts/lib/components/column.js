import BaseComponent from './baseComponent'
import _ from 'lodash'
import d3 from 'd3'
import HorizontalWrappedLabel from './parts/horizontalWrappedLabel'
import { enums } from 'rhtmlLabelUtils'

class Column extends BaseComponent {
  constructor ({
    parentContainer,
    controller,
    classNames,
    labels,
    horizontalAlignment,
    fontSize,
    fontColor,
    fontFamily,
    maxWidth,
    maxHeight,
  }) {
    super()
    _.assign(this, {
      parentContainer,
      controller,
      classNames,
      labels,
      horizontalAlignment,
      fontSize,
      fontColor,
      fontFamily,
      maxWidth,
      maxHeight,
    })

    this.rowCount = this.labels.length
  }

  computePreferredDimensions () {
    this.labelObjects = this.labels.map((text, index) => {
      return new HorizontalWrappedLabel({
        classNames: 'column-label',
        fontColor: this.fontColor,
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        maxHeight: this.maxHeight,
        maxWidth: this.maxWidth,
        parentContainer: this.parentContainer,
        text: text,
        verticalAlignment: enums.verticalAlignment.CENTER,
        horizontalAlignment: this.horizontalAlignment,
      })
    })
    let labelDimensions = this.labelObjects.map(labelObject => labelObject.computePreferredDimensions())
    return {
      width: _(labelDimensions).map('width').max(),
      height: 0, // NB take what is provided
    }
  }

  draw (bounds) {
    this.bounds = bounds
    this.container = this.parentContainer.append('g')
      .classed(`${this.classNames} column`, true)
      .attr('transform', this.buildTransform(bounds))

    const rowHeight = bounds.height / this.labels.length
    this.labelObjects.map((labelObject, i) => {
      labelObject.draw({
        container: this.container, // this is odd given we already supply parentContainer to constructor
        bounds: {
          top: i * rowHeight,
          left: 0,
          height: rowHeight,
          width: bounds.width,
        },
        onClick: () => {
          this.controller.columnCellClick(i)
          d3.event.stopPropagation()
        },
      })
    })
  }

  updateHighlights ({ row = null } = {}) {
    this.container.selectAll('.column-label text')
      .classed('highlight', (d, i) => (row === i))
  }

  applyZoom ({ scale, translate, extent }) {
    const rowsInZoom = _.range(extent[0][1], extent[1][1])
    const inFocusExtent = rowsInZoom.length
    const numberCellsAboveOutOfFocus = extent[0][1]
    const newCellHeight = this.bounds.height / inFocusExtent
    const newStartingPoint = -1 * numberCellsAboveOutOfFocus * newCellHeight

    // NB relies on CSS in heatmapcore.less
    this.labelObjects.map((labelObject, i) => labelObject.applyVerticalZoom({
      yOffset: newStartingPoint + newCellHeight * i,
      newCellHeight,
      inZoom: _.includes(rowsInZoom, i),
    }))
  }

  resetZoom () {
    const rowHeight = this.bounds.height / this.rowCount
    this.labelObjects.map((labelObject, i) => labelObject.resetVerticalZoom({ yOffset: rowHeight * i }))
  }
}

module.exports = Column
