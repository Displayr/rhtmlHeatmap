import _ from 'lodash'
import BaseComponent from '../baseComponent'
import { enums, getDimensions, addLabel } from 'rhtmlLabelUtils'

const DEBUG = false

class HorizontalWrappedLabel extends BaseComponent {
  constructor ({
    verticalAlignment = enums.verticalAlignment.TOP,
    horizontalAlignment = enums.horizontalAlignment.CENTER,
    parentContainer,
    text,
    fontSize,
    fontFamily,
    fontColor,
    controller,
    maxWidth,
    maxHeight,
    classNames,
  }) {
    super()
    _.assign(this, {
      verticalAlignment,
      horizontalAlignment,
      parentContainer,
      text,
      fontSize,
      fontFamily,
      fontColor,
      controller,
      maxWidth,
      maxHeight,
      classNames,
    })
  }

  computePreferredDimensions () {
    return getDimensions({
      parentContainer: this.parentContainer,
      text: this.text,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      orientation: enums.orientation.HORIZONTAL,
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
      orientation: enums.orientation.HORIZONTAL,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: this.horizontalAlignment,
    })

    this.textSelection.on('click', onClick)
  }

  applyHorizontalZoom ({ newCellWidth, xOffset, inZoom }) {
    this.container
      .attr('transform', `translate(${xOffset},${this.bounds.top})`)

    this.rectSelection
      .attr('width', newCellWidth)

    this.textSelection.remove()

    this.textSelection = addLabel({
      parentContainer: this.container,
      text: this.text,
      bounds: { width: newCellWidth, height: this.bounds.height },
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.HORIZONTAL,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: this.horizontalAlignment,
    })

    this.textSelection
      .on('click', this.onClick)
      .classed('in-zoom', inZoom)
  }

  resetHorizontalZoom ({ xOffset }) {
    this.container.attr('transform', `translate(${xOffset},${this.bounds.top})`)

    this.rectSelection.attr('width', this.bounds.width)

    this.textSelection.remove()

    this.textSelection = addLabel({
      parentContainer: this.container,
      text: this.text,
      bounds: this.bounds,
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.HORIZONTAL,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: this.horizontalAlignment,
    })

    this.textSelection
      .on('click', this.onClick)
      .classed('in-zoom', false)
  }

  applyVerticalZoom ({ newCellHeight, yOffset, inZoom }) {
    this.container.attr('transform', `translate(${this.bounds.left},${yOffset})`) // TODO should this be this.bounds.top + yOffset

    this.rectSelection.attr('height', newCellHeight)

    this.textSelection.remove()

    this.textSelection = addLabel({
      parentContainer: this.container,
      text: this.text,
      bounds: { width: this.bounds.width, height: newCellHeight },
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.HORIZONTAL,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: this.horizontalAlignment,
    })

    this.textSelection
      .on('click', this.onClick)
      .classed('in-zoom', inZoom)
  }

  resetVerticalZoom ({ yOffset }) {
    this.container.attr('transform', `translate(${this.bounds.left},${yOffset})`)

    this.rectSelection.attr('height', this.bounds.height)

    this.textSelection.remove()

    this.textSelection = addLabel({
      parentContainer: this.container,
      text: this.text,
      bounds: this.bounds,
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.HORIZONTAL,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: this.horizontalAlignment,
    })

    this.textSelection
      .on('click', this.onClick)
      .classed('in-zoom', false)
  }
}

module.exports = HorizontalWrappedLabel
