import _ from 'lodash'
import BaseComponent from '../baseComponent'
import { enums, getDimensions, addLabel } from 'rhtmlLabelUtils'

const DEBUG = false

class VerticalBottomToTopWrappedLabel extends BaseComponent {
  constructor ({ verticalAlignment, parentContainer, text, fontSize, fontFamily, fontColor, maxWidth, maxHeight, classNames }) {
    super()
    _.assign(this, { verticalAlignment, parentContainer, text, fontSize, fontFamily, fontColor, maxWidth, maxHeight, classNames })
  }

  computePreferredDimensions () {
    return getDimensions({
      parentContainer: this.parentContainer,
      text: this.text,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      orientation: enums.orientation.BOTTOM_TO_TOP,
    })
  }

  draw ({ container: parentContainer, bounds, onClick }) {
    this.bounds = bounds
    this.onClick = onClick

    this.container = parentContainer.append('g')
      .classed(this.classNames, true)
      .attr('transform', this.buildTransform(bounds))

    this.rectSelection = this.container.append('rect')
      .classed('click-rect', true)
      .attr('width', bounds.width)
      .attr('height', bounds.height)
      .attr('fill', 'transparent')
      .attr('stroke', (DEBUG) ? 'lightgrey' : 'transparent')
      .on('click', onClick)

    this.textSelection = addLabel({
      parentContainer: this.container,
      text: this.text,
      bounds,
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.BOTTOM_TO_TOP,
      verticalAlignment: this.verticalAlignment, // TODO seems this could safely be hard code to bottom aligned ?
      horizontalAlignment: enums.horizontalAlignment.CENTER,
    })

    this.textSelection.on('click', onClick)
  }

  applyHorizontalZoom ({ newCellWidth, xOffset, inZoom }) {
    this.container.attr('transform', `translate(${xOffset},${this.bounds.top})`)

    this.rectSelection.attr('width', newCellWidth)

    this.textSelection.remove()

    this.textSelection = addLabel({
      parentContainer: this.container,
      text: this.text,
      bounds: { width: newCellWidth, height: this.bounds.height },
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.BOTTOM_TO_TOP,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: enums.horizontalAlignment.CENTER,
    })

    this.textSelection
      .on('click', this.onClick)
      .classed('in-zoom', inZoom)
  }

  resetHorizontalZoom ({ xOffset }) {
    this.container.attr('transform', `translate(${xOffset},${this.bounds.top})`)

    this.rectSelection.attr('width', this.bounds.width)

    this.textSelection = addLabel({
      parentContainer: this.container,
      text: this.text,
      bounds: this.bounds,
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.BOTTOM_TO_TOP,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: enums.horizontalAlignment.CENTER,
    })

    this.textSelection
      .on('click', this.onClick)
      .classed('in-zoom', false)
  }
}

module.exports = VerticalBottomToTopWrappedLabel
