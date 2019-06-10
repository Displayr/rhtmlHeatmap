import _ from 'lodash'
import BaseComponent from '../baseComponent'
import { splitIntoLinesByCharacter, getLabelDimensionsUsingSvgApproximation } from '../../labelUtils'

const DEBUG = false

class VerticalBottomToTopWrappedLabel extends BaseComponent {
  constructor ({ verticalAlignment, parentContainer, text, fontSize, fontFamily, fontColor, maxWidth, maxHeight, classNames }) {
    super()
    _.assign(this, { verticalAlignment, parentContainer, text, fontSize, fontFamily, fontColor, maxWidth, maxHeight, classNames })

    this.maxLines = 1
  }

  computePreferredDimensions () {
    const lines = splitIntoLinesByCharacter({
      parentContainer: this.parentContainer,
      text: this.text,
      maxHeight: this.maxHeight,
      maxLines: this.maxLines,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      rotation: 90
    })
    const dimensions = getLabelDimensionsUsingSvgApproximation({
      text: lines[0],
      parentContainer: this.parentContainer,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      rotation: 90
    })

    return dimensions
  }

  draw ({ container: parentContainer, bounds, onClick }) {
    this.bounds = bounds

    const text = splitIntoLinesByCharacter({
      parentContainer,
      text: this.text,
      maxHeight: this.maxHeight,
      maxLines: this.maxLines,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      rotation: 90
    })[0]

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

    this.textSelection = this.container.append('text')
      .attr('transform', `translate(${bounds.width / 2}, 0),rotate(90)`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', 0)
      .style('text-anchor', 'start')
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
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
      .attr('transform', `translate(${newCellWidth / 2}, 0),rotate(90)`)
      .classed('in-zoom', inZoom)
  }

  resetHorizontalZoom ({ xOffset }) {
    this.container
      .attr('transform', `translate(${xOffset},${this.bounds.top})`)

    this.rectSelection
      .attr('width', this.bounds.width)

    this.textSelection
      .attr('transform', `translate(${this.bounds.width / 2}, 0),rotate(90)`)
      .classed('in-zoom', false)
  }
}

module.exports = VerticalBottomToTopWrappedLabel
