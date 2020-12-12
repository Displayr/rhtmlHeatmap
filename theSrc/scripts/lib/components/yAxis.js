import _ from 'lodash'
import d3 from 'd3'
import BaseComponent from './baseComponent'
import HorizontalWrappedLabel from './parts/horizontalWrappedLabel'
import { enums } from 'rhtmlLabelUtils'
const {
  verticalAlignment: { CENTER },
  horizontalAlignment: { LEFT, RIGHT },
} = enums

class YAxis extends BaseComponent {
  constructor ({ parentContainer, placement, labels, fontSize, fontFamily, fontColor, maxWidth, maxHeight, controller }) {
    super()
    _.assign(this, { parentContainer, placement, labels, fontSize, fontFamily, fontColor, maxWidth, maxHeight, controller })

    // to deal with superflous zoom calls at beginning of render
    this.amIZoomed = false
  }

  computePreferredDimensions () {
    this.labelObjects = this.labels.map((text, index) => {
      return new HorizontalWrappedLabel({
        classNames: `yaxis-label tick-${index}`,
        fontColor: this.fontColor,
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        maxHeight: this.maxHeight / this.labels.length,
        maxWidth: this.maxWidth,
        parentContainer: this.parentContainer,
        text: text,
        verticalAlignment: CENTER,
        horizontalAlignment: (this.placement === 'left') ? RIGHT : LEFT,
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
    const container = this.parentContainer.append('g')
      .classed('axis yaxis', true)
      .attr('transform', this.buildTransform(bounds))

    const rowHeight = bounds.height / this.labels.length
    this.labelObjects.map((labelObject, i) => {
      labelObject.draw({
        container, // this is odd given we already supply parentContainer to constructor
        bounds: {
          top: i * rowHeight,
          left: 0,
          height: rowHeight,
          width: bounds.width,
        },
        onClick: () => {
          this.controller.yaxisClick(i)
          d3.event.stopPropagation()
        },
      })
    })
  }

  // NB relies on CSS in heatmapcore.less
  updateHighlights ({ row = null } = {}) {
    this.parentContainer.selectAll('.yaxis-label text')
      .classed('highlight', (d, i) => (row === i))
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
    const rowHeight = this.bounds.height / this.labels.length
    this.labelObjects.map((labelObject, i) => labelObject.resetVerticalZoom({ yOffset: rowHeight * i }))
  }
}

module.exports = YAxis
