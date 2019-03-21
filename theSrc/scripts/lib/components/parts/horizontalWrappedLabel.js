import _ from 'lodash'
import BaseComponent from '../baseComponent'
import {getLabelDimensionsUsingSvgApproximation, splitIntoLinesByWord} from '../../labelUtils'

const DEBUG = false

class HorizontalWrappedLabel extends BaseComponent {
  constructor ({
    verticalAlignment = 'top',
    horizontalAlignment = 'center',
    parentContainer,
    text,
    fontSize,
    fontFamily,
    fontColor,
    controller,
    maxWidth,
    maxHeight,
    classNames
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
      classNames
    })

    this.innerLinePadding = 1 // TODO move up
  }

  computePreferredDimensions () {
    const lines = splitIntoLinesByWord({
      parentContainer: this.parentContainer,
      text: this.text,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily
    })
    this.estimatedLineCount = lines.length
    const lineDimensions = lines.map(text => getLabelDimensionsUsingSvgApproximation({
      text,
      parentContainer: this.parentContainer,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      rotation: 0
    }))

    return {
      width: _(lineDimensions).map('width').max(),
      height: _(lineDimensions).map('height').sum() + (lines.length - 1) * this.innerLinePadding
    }
  }

  draw ({ container: parentContainer, bounds, onClick }) {
    this.bounds = bounds

    // NB here we are not using this.maxWidth/this.maxHeight, we are using values in bounds, thus we need to recompute
    this.lines = splitIntoLinesByWord({
      parentContainer,
      text: this.text,
      maxWidth: bounds.width, // NB note here we are not using this.maxWidth, we are using bounds provided
      maxHeight: bounds.height, // NB note here we are not using this.maxHeight, we are using bounds provided
      fontSize: this.fontSize,
      fontFamily: this.fontFamily
    })

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

    const extraSpace = bounds.height -
      (this.fontSize * this.lines.length + this.innerLinePadding * (this.lines.length - 1))

    const textYOffset = (this.verticalAlignment === 'center' && extraSpace > 0)
      ? extraSpace / 2
      : 0

    this.textSelection = this.container.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', 0)
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
      .style('fill', this.fontColor)
      .on('click', onClick)

    switch (this.horizontalAlignment) {
      case 'left':
        this.textSelection
          .attr('transform', `translate(0, ${textYOffset})`)
          .style('text-anchor', 'start')
        break
      case 'center':
        this.textSelection
          .attr('transform', `translate(${bounds.width / 2}, ${textYOffset})`)
          .style('text-anchor', 'middle')
        break
      case 'right':
        this.textSelection
          .attr('transform', `translate(${bounds.width}, ${textYOffset})`)
          .style('text-anchor', 'end')
        break
      default:
        throw new Error(`unknown horizontal alignment: '${this.horizontalAlignment}'`)
    }

    const useBoundsIfFirstRowAndFontTooLarge = (i) => (i === 0) ? Math.min(this.bounds.height, this.fontSize) : this.fontSize

    switch (this.verticalAlignment) {
      case 'top':
        _(this.lines).each((line, i) => {
          this.textSelection.append('tspan')
            .style('dominant-baseline', 'text-before-edge')
            .attr('x', 0)
            .attr('y', i * (this.fontSize + this.innerLinePadding))
            .text(line)
        })
        break
      case 'center':
        _(this.lines).each((line, i) => {
          this.textSelection.append('tspan')
            .style('dominant-baseline', 'central')
            .attr('x', 0)
            .attr('y', useBoundsIfFirstRowAndFontTooLarge(i) / 2 + i * (this.fontSize + this.innerLinePadding))
            .text(line)
        })
        break
      case 'bottom':
        _(this.lines).reverse().each((line, i) => {
          this.textSelection.append('tspan')
            .style('dominant-baseline', 'text-after-edge')
            .attr('x', 0)
            .attr('y', bounds.height - i * (this.fontSize + this.innerLinePadding))
            .text(line)
        })
        break
      default:
        throw new Error(`unknown vertical alignment: '${this.verticalAlignment}'`)
    }
  }

  applyHorizontalZoom ({ newCellWidth, xOffset, inZoom }) {
    const extraVerticalSpace = this.bounds.height -
      (this.fontSize * this.lines.length + this.innerLinePadding * (this.lines.length - 1))

    const textYOffset = (this.verticalAlignment === 'center' && extraVerticalSpace > 0)
      ? extraVerticalSpace / 2
      : 0

    this.container
      .attr('transform', `translate(${xOffset},${this.bounds.top})`) // TODO should this be this.bounds.left + xOffset

    this.rectSelection
      .attr('width', newCellWidth)

    this.textSelection
      .classed('in-zoom', inZoom)

    switch (this.horizontalAlignment) {
      case 'left':
        this.textSelection
          .attr('transform', `translate(0, ${textYOffset})`)
          .style('text-anchor', 'start')
        break
      case 'center':
        this.textSelection
          .attr('transform', `translate(${newCellWidth / 2}, ${textYOffset})`)
          .style('text-anchor', 'middle')
        break
      case 'right':
        this.textSelection
          .attr('transform', `translate(${newCellWidth}, ${textYOffset})`)
          .style('text-anchor', 'end')
        break
    }
  }

  resetHorizontalZoom ({xOffset}) {
    this.container
      .attr('transform', `translate(${xOffset},${this.bounds.top})`)

    this.rectSelection
      .attr('width', this.bounds.width)

    const extraSpace = this.bounds.height -
      (this.fontSize * this.lines.length + this.innerLinePadding * (this.lines.length - 1))

    const textYOffset = (this.verticalAlignment === 'center' && extraSpace > 0)
      ? extraSpace / 2
      : 0

    this.textSelection
      .classed('in-zoom', false)

    switch (this.horizontalAlignment) {
      case 'left':
        this.textSelection
          .attr('transform', `translate(0, ${textYOffset})`)
        break
      case 'center':
        this.textSelection
          .attr('transform', `translate(${this.bounds.width / 2}, ${textYOffset})`)
        break
      case 'right':
        this.textSelection
          .attr('transform', `translate(${this.bounds.width}, ${textYOffset})`)
        break
    }
  }

  applyVerticalZoom ({ newCellHeight, yOffset, inZoom }) {
    if (this.verticalAlignment === 'bottom') {
      throw new Error('vertical zoom of a bottom aligned horizontal label is not yet supported')
    }

    const extraVerticalSpace = newCellHeight -
      (this.fontSize * this.lines.length + this.innerLinePadding * (this.lines.length - 1))

    const textYOffset = (this.verticalAlignment === 'center' && extraVerticalSpace > 0)
      ? extraVerticalSpace / 2
      : 0

    this.container
      .attr('transform', `translate(${this.bounds.left},${yOffset})`) // TODO should this be this.bounds.top + yOffset

    this.rectSelection
      .attr('height', newCellHeight)

    this.textSelection
      .classed('in-zoom', inZoom)

    switch (this.horizontalAlignment) {
      case 'left':
        this.textSelection
          .attr('transform', `translate(0, ${textYOffset})`)
        break
      case 'center':
        this.textSelection
          .attr('transform', `translate(${this.bounds.width / 2}, ${textYOffset})`)
        break
      case 'right':
        this.textSelection
          .attr('transform', `translate(${this.bounds.width}, ${textYOffset})`)
        break
    }
  }

  resetVerticalZoom ({yOffset}) {
    const extraVerticalSpace = this.bounds.height -
      (this.fontSize * this.lines.length + this.innerLinePadding * (this.lines.length - 1))

    const textYOffset = (this.verticalAlignment === 'center' && extraVerticalSpace > 0)
      ? extraVerticalSpace / 2
      : 0

    this.container
      .attr('transform', `translate(${this.bounds.left},${yOffset})`)

    this.rectSelection
      .attr('height', this.bounds.height)

    this.textSelection
      .classed('in-zoom', false)

    switch (this.horizontalAlignment) {
      case 'left':
        this.textSelection
          .attr('transform', `translate(0, ${textYOffset})`)
        break
      case 'center':
        this.textSelection
          .attr('transform', `translate(${this.bounds.width / 2}, ${textYOffset})`)
        break
      case 'right':
        this.textSelection
          .attr('transform', `translate(${this.bounds.width}, ${textYOffset})`)
        break
    }
  }
}

module.exports = HorizontalWrappedLabel
