import BaseComponent from './baseComponent'
import _ from 'lodash'
import {getLabelDimensionsUsingSvgApproximation, splitIntoLinesByWord} from '../labelUtils'
import d3 from 'd3'

// TODO preferred dimensions must account for maxes
class XAxis extends BaseComponent {
  constructor ({parentContainer, text, name, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines}) {
    super()
    _.assign(this, {parentContainer, text, name, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines})
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

  draw (bounds) {
    const titleContainer = this.parentContainer
      .append('g')
      .classed('title', true)
      .classed(this.name, true)
      .attr('transform', this.buildTransform(bounds))

    const { text, fontFamily, fontSize, parentContainer, maxLines, innerLinePadding } = this
    titleContainer.append('text')
      .attr('transform', `translate(${bounds.width / 2}, 0)`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', 0)
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'text-before-edge')
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
      .style('fill', this.fontColor)
      .on('click', (d, i) => {
        this.controller.xaxisClick(i)
        d3.event.stopPropagation()
      })
      .each(function () {
        const lines = splitIntoLinesByWord({
          parentContainer: parentContainer,
          text: text,
          maxWidth: bounds.width,
          fontSize: fontSize,
          fontFamily: fontFamily,
          maxLines: maxLines
        })
        const textGroup = d3.select(this)
        _(lines).each((lineText, i) => {
          textGroup.append('tspan')
            .attr('x', 0)
            .attr('y', i * (fontSize + innerLinePadding))
            .style('font-size', fontSize)
            .style('font-family', fontFamily)
            .style('dominant-baseline', 'text-before-edge')
            .text(lineText)
        })
      })
  }
}

module.exports = XAxis
