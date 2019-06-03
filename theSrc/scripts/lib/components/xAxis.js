import _ from 'lodash'
import d3 from 'd3'
import BaseComponent from './baseComponent'

import HorizontalWrappedLabel from './parts/horizontalWrappedLabel'
import VerticalBottomToTopWrappedLabel from './parts/verticalBottomToTopWrappedLabel'
import VerticalTopToBottomWrappedLabel from './parts/verticalTopToBottomWrappedLabel'
import DiagonalUpWrappedLabel from './parts/diagonalUpWrappedLabel'
import DiagonalDownWrappedLabel from './parts/diagonalDownWrappedLabel'

class XAxis extends BaseComponent {
  constructor ({
                fontColor,
                fontFamily,
                fontSize,
                labels,
                maxHeight,
                orientation,
                parentContainer,
                placement
              }) {
    super()
    _.assign(this, {
      fontColor,
      fontFamily,
      fontSize,
      labels,
      maxHeight,
      orientation,
      parentContainer,
      placement
    })

    // to deal with superfluous zoom calls at beginning of render
    this.amIZoomed = false
    this.columnCount = this.labels.length

    if (this.orientation === 'horizontal') {
      this.LabelFactory = HorizontalWrappedLabel
    } else if (this.orientation === 'vertical' && this.placement === 'top') {
      this.LabelFactory = VerticalBottomToTopWrappedLabel
    } else if (this.orientation === 'vertical' && this.placement === 'bottom') {
      this.LabelFactory = VerticalTopToBottomWrappedLabel
    } else if (this.orientation === 'diagonal' && this.placement === 'top') {
      this.LabelFactory = DiagonalUpWrappedLabel
    } else if (this.orientation === 'diagonal' && this.placement === 'bottom') {
      this.LabelFactory = DiagonalDownWrappedLabel
    } else {
      throw new Error(`could not determine LabelFactory: orientation: '${this.orientation}', placement: ${this.placement}`)
    }
  }

  computePreferredDimensions (estimatedColumnWidth) {
    this.labelObjects = this.labels.map((text, index) => {
      return new this.LabelFactory({
        classNames: `xaxis-label tick-${index}`,
        fontColor: this.fontColor,
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        maxHeight: this.maxHeight,
        maxWidth: estimatedColumnWidth,
        parentContainer: this.parentContainer,
        text: text,
        verticalAlignment: this.placement === 'top' ? 'bottom' : 'top',
        horizontalAlignment: 'center'
      })
    })
    let labelDimensions = this.labelObjects.map(labelObject => labelObject.computePreferredDimensions())

    const preferredDimensions = {
      width: 0, // NB xaxis width takes what is given, and does not force width on the chart
      height: _(labelDimensions).map('height').max()
    }

    // NB The intent of the conditional.rightmostMargin addition to dimensions:
    // if Im diagonal labels, and Im the furthest component on the right
    // then reserved space on the right to avoid truncation
    // the rightmostMargin conditional will only be added if the columnSubtitles are the rightmost component
    if (this.orientation === 'diagonal') {
      const requiredExtraSpaceToRight = _(labelDimensions)
        .map('width')
        .map((labelWidth, i) => {
          const availableWidthToRightOfColumn = (this.columnCount - 1 - i) * estimatedColumnWidth
          const labelOverflow = Math.max(0, labelWidth - 0.5 * estimatedColumnWidth)
          return Math.max(0, labelOverflow - availableWidthToRightOfColumn)
        })
        .max()

      if (requiredExtraSpaceToRight > 0) {
        preferredDimensions.conditional = {
          rightmostMargin: requiredExtraSpaceToRight
        }
      }
    }

    return preferredDimensions
  }

  draw (bounds) {
    this.bounds = bounds
    const container = this.parentContainer.append('g')
      .classed('axis xaxis', true)
      .attr('transform', this.buildTransform(bounds))

    const columnWidth = bounds.width / this.columnCount
    this.labelObjects.map((labelObject, i) => {
      // TODO instead of checking for existence of fn, really we should be checking that LabelFactory = DiagonalDownWrappedLabel OR DiagonalDownWrappedLabel
      if (_.isFunction(labelObject.setAvailableSpaceToTheRight)) {
        const widthOfColumnsToTheRight = ((this.columnCount - 1) - i) * columnWidth
        const widthOfComponentsToTheRight = bounds.canvasWidth - (bounds.left + bounds.width)
        labelObject.setAvailableSpaceToTheRight(widthOfColumnsToTheRight + widthOfComponentsToTheRight)
      }
      labelObject.draw({
        container, // this is odd given we already supply parentContainer to constructor
        bounds: {
          top: 0,
          left: i * columnWidth,
          height: bounds.height,
          width: columnWidth
        },
        onClick: () => {
          this.controller.xaxisClick(i)
          d3.event.stopPropagation()
        }
      })
    })
  }

  // NB relies on CSS in heatmapcore.less
  updateHighlights ({column = null} = {}) {
    this.parentContainer.selectAll('.xaxis-label text')
      .classed('highlight', (d, i) => column === i)
  }

  // Example call, upon selecting row [0,0]: column [1,2]
  // {
  //   "scale": [ 2, 7 ],
  //   "translate": [ -450.1803455352783, 0 ],
  //   "extent": [ [ 1, 0 ], [ 3, 1 ] ]
  // }
  updateZoom ({scale, translate, extent, zoom}) {
    if (!zoom && !this.amIZoomed) {
      return
    }
    if (zoom && this.amIZoomed) {
      return
    }
    this.amIZoomed = zoom
    if (this.amIZoomed) {
      this.applyZoom({scale, translate, extent})
    } else {
      return this.resetZoom()
    }
  }

  applyZoom ({scale, translate, extent}) {
    const columnsInZoom = _.range(extent[0][0], extent[1][0])
    const inFocusExtent = columnsInZoom.length
    const numberCellsToLeftOutOfFocus = extent[0][0]
    const newCellWidth = this.bounds.width / inFocusExtent
    const newStartingPoint = -1 * numberCellsToLeftOutOfFocus * newCellWidth

    // NB relies on CSS in heatmapcore.less
    this.labelObjects.map((labelObject, i) => labelObject.applyHorizontalZoom({
      xOffset: newStartingPoint + newCellWidth * i,
      newCellWidth,
      inZoom: _.includes(columnsInZoom, i)
    }))
  }

  resetZoom () {
    const columnWidth = this.bounds.width / this.columnCount
    this.labelObjects.map((labelObject, i) => labelObject.resetHorizontalZoom({xOffset: columnWidth * i}))
  }
}

module.exports = XAxis
