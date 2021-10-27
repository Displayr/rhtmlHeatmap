import _ from 'lodash'
import BaseComponent from '../baseComponent'
import { enums, splitIntoLines, getSingleLineLabelDimensions } from 'rhtmlLabelUtils'

const DEBUG = false

class DiagonalUpWrappedLabel extends BaseComponent {
  constructor ({ canvas, text, fontSize, fontFamily, fontColor, maxHeight, classNames }) {
    super()
    _.assign(this, { canvas, text, fontSize, fontFamily, fontColor, maxHeight, classNames })

    this.maxLines = 1
    this.extraSpaceToRight = 0
  }

  setAvailableSpaceToTheRight (extraSpaceToRight) {
    this.extraSpaceToRight = extraSpaceToRight
  }

  computePreferredDimensions () {
    // NB do not specify max width, as rotated labels are allowed to extend into adjacent neighboring label cells
    const lines = splitIntoLines({
      wrap: enums.wrap.CHARACTER,
      parentContainer: this.canvas,
      text: this.text,
      maxHeight: this.maxHeight,
      maxLines: this.maxLines,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      orientation: enums.orientation.NORTH_EAST,
    })
    const dimensions = getSingleLineLabelDimensions({
      text: lines[0],
      parentContainer: this.canvas,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      orientation: enums.orientation.SOUTH_EAST,
    })

    return dimensions
  }

  draw ({ container, bounds, onClick }) {
    this.bounds = bounds

    // NB do not specify max width, as rotated labels are allowed to extend into adjacent neighboring label cells
    const text = splitIntoLines({
      wrap: enums.wrap.CHARACTER,
      parentContainer: container,
      text: this.text,
      maxHeight: this.maxHeight,
      // NB the "this.fontSize / 2" assumes rotation of 45, and accounts for the portion of label that will sit to the left of the horizontal mid point of the column
      maxWidth: bounds.width / 2 + this.extraSpaceToRight + this.fontSize / 2,
      maxLines: this.maxLines,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      orientation: enums.orientation.SOUTH_EAST,
    })[0]

    this.container = container.append('g')
      .classed(this.classNames, true)
      .attr('transform', this.buildTransform(bounds))

    this.rectSelection = this.container.append('rect')
      .classed('click-rect', true)
      .attr('transform', `translate(${bounds.height},0), skewX(-45)`)
      .attr('width', bounds.width)
      .attr('height', bounds.height)
      .attr('fill', 'transparent')
      .attr('stroke', (DEBUG) ? 'lightgrey' : 'transparent')
      .on('click', onClick)

    this.textSelection = this.container.append('text')
      .attr('transform', `translate(${bounds.width / 2}, ${bounds.height}),rotate(-45)`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', 0)
      .style('text-anchor', 'start')
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize + 'px')
      .style('fill', this.fontColor)
      .text(text)
      .on('click', onClick)
  }

  applyHorizontalZoom ({ newCellWidth, xOffset, inZoom }) {
    this.container
      .attr('transform', `translate(${xOffset},${this.bounds.top})`)

    this.rectSelection
      .attr('width', newCellWidth)

    this.textSelection
      .attr('transform', `translate(${newCellWidth / 2}, ${this.bounds.height}),rotate(-45)`)
      .classed('in-zoom', inZoom)
  }

  resetHorizontalZoom ({ xOffset }) {
    this.container
      .attr('transform', `translate(${xOffset},${this.bounds.top})`)

    this.rectSelection
      .attr('width', this.bounds.width)

    this.textSelection
      .attr('transform', `translate(${this.bounds.width / 2}, ${this.bounds.height}),rotate(-45)`)
      .classed('in-zoom', false)
  }
}

module.exports = DiagonalUpWrappedLabel
