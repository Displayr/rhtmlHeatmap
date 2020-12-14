import _ from 'lodash'
import BaseComponent from '../baseComponent'
import { enums, getDimensions, addLabel } from 'rhtmlLabelUtils'

const DEBUG = false

class LabelUtilsWrapper extends BaseComponent {
  constructor ({
    verticalAlignment = enums.verticalAlignment.TOP,
    horizontalAlignment = enums.horizontalAlignment.CENTER,
    orientation = enums.orientation.HORIZONTAL,
    canvas,
    text,
    fontSize,
    fontFamily,
    fontColor,
    fontWeight,
    maxWidth,
    maxHeight,
    maxLines,
    classNames,
  }) {
    super()
    _.assign(this, {
      verticalAlignment,
      horizontalAlignment,
      orientation,
      canvas,
      text,
      fontSize,
      fontFamily,
      fontColor,
      fontWeight,
      maxWidth,
      maxHeight,
      maxLines,
      classNames,
      bounds: { width: null, height: null },
      onClick: null,
    })
  }

  setMaxWidth (maxWidth) {
    this.maxWidth = maxWidth
  }

  computePreferredDimensions () {
    return getDimensions({
      parentContainer: this.canvas,
      text: this.text,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight,
      maxLines: this.maxLines,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      orientation: this.orientation,
    })
  }

  // NB relies on draw being called and setting this.onClick and this.bounds
  addText ({
    width = this.bounds.width,
    height = this.bounds.height,
    inZoom = null,
  } = {}) {
    if (this.textSelection) {
      this.textSelection.remove()
    }

    this.textSelection = addLabel({
      parentContainer: this.container,
      text: this.text,
      bounds: { width, height },
      maxLines: this.maxLines,
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      orientation: this.orientation,
      verticalAlignment: this.verticalAlignment,
      horizontalAlignment: this.horizontalAlignment,
    })

    if (this.onClick) { this.textSelection.on('click', this.onClick) }
    if (!_.isNull(inZoom)) { this.textSelection.classed('in-zoom', inZoom) }
  }

  draw ({ container, bounds, onClick = null }) {
    this.bounds = bounds
    this.onClick = onClick

    this.container = container.append('g')
      .classed(this.classNames, true)
      .attr('transform', this.buildTransform(bounds))

    if (this.onClick) {
      this.rectSelection = this.container.append('rect')
        .classed('click-rect', true)
        .attr('width', bounds.width)
        .attr('height', bounds.height)
        .attr('fill', 'transparent')
        .attr('stroke', (DEBUG) ? 'lightgrey' : 'transparent')
        .on('click', this.onClick)
    }

    this.addText()
  }

  applyHorizontalZoom ({ newCellWidth, xOffset, inZoom }) {
    this.container.attr('transform', `translate(${xOffset},${this.bounds.top})`)
    if (this.onClick) { this.rectSelection.attr('width', newCellWidth) }
    this.addText({ width: newCellWidth, inZoom })
  }

  resetHorizontalZoom ({ xOffset }) {
    this.container.attr('transform', `translate(${xOffset},${this.bounds.top})`)
    if (this.onClick) { this.rectSelection.attr('width', this.bounds.width) }
    this.addText({ inZoom: false })
  }

  applyVerticalZoom ({ newCellHeight, yOffset, inZoom }) {
    this.container.attr('transform', `translate(${this.bounds.left},${yOffset})`) // TODO should this be this.bounds.top + yOffset
    if (this.onClick) { this.rectSelection.attr('height', newCellHeight) }
    this.addText({ height: newCellHeight, inZoom })
  }

  resetVerticalZoom ({ yOffset }) {
    this.container.attr('transform', `translate(${this.bounds.left},${yOffset})`)
    if (this.onClick) { this.rectSelection.attr('height', this.bounds.height) }
    this.addText({ inZoom: false })
  }
}

module.exports = LabelUtilsWrapper
