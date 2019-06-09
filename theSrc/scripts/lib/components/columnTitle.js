import BaseComponent from './baseComponent'
import _ from 'lodash'
import { getLabelDimensionsUsingSvgApproximation, splitIntoLinesByWord } from '../labelUtils'
import d3 from 'd3'

// TODO preferred dimensions must account for maxes
class ColumnTitle extends BaseComponent {
  constructor ({ parentContainer, text, classNames, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines }) {
    super()
    _.assign(this, { parentContainer, text, classNames, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines })
    this.innerLinePadding = 1 // TODO move up
  }

  computePreferredDimensions () {
    const lines = splitIntoLinesByWord({
      parentContainer: this.parentContainer,
      text: this.text,
      maxWidth: this.maxWidth,
      fontSize: this.fontSize,
      maxLines: this.maxLines,
      fontFamily: this.fontFamily
    })
    const lineDimensions = lines.map(text => getLabelDimensionsUsingSvgApproximation({
      text,
      parentContainer: this.parentContainer,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      rotation: this.rotation
    }))

    return {
      width: _(lineDimensions).map('width').max(),
      height: _(lineDimensions).map('height').sum() + (lines.length - 1) * this.innerLinePadding
    }
  }

  forceWidth (forcedWidth) {
    this.forcedWidth = forcedWidth
  }

  draw (bounds) {
    const adjustedBounds = (this.forcedWidth)
      ? _.merge({}, bounds, { width: this.forcedWidth })
      : bounds

    const titleContainer = this.parentContainer
      .append('g')
      .classed('title', true)
      .classed(this.classNames, true)
      .attr('transform', this.buildTransform(adjustedBounds))

    const { text, fontFamily, fontSize, parentContainer, maxLines, innerLinePadding } = this
    titleContainer.append('text')
      .attr('transform', `translate(${adjustedBounds.width / 2}, 0)`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', 0)
      .style('text-anchor', 'middle')
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
      .style('font-weight', this.bold ? 'bold' : 'normal')
      .style('fill', this.fontColor)
      .on('click', (d, i) => {
        this.controller.xaxisClick(i)
        d3.event.stopPropagation()
      })
      .each(function () {
        const lines = splitIntoLinesByWord({
          parentContainer: parentContainer,
          text: text,
          maxWidth: adjustedBounds.width,
          fontSize: fontSize,
          fontFamily: fontFamily,
          maxLines: maxLines
        })
        const textGroup = d3.select(this)
        _(lines).each((lineText, i) => {
          textGroup.append('tspan')
            .style('dominant-baseline', 'text-before-edge')
            .attr('x', 0)
            .attr('y', i * (fontSize + innerLinePadding))
            .text(lineText)
        })
      })
  }
}

module.exports = ColumnTitle
