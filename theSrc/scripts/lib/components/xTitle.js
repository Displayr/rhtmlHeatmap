import BaseComponent from './baseComponent'
import _ from 'lodash'
import {getLabelDimensionsUsingSvgApproximation, splitIntoLinesByWord} from '../labelUtils'

// TODO preferred dimensions must account for maxes
class XAxis extends BaseComponent {
  constructor ({parentContainer, text, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines}) {
    super()
    _.assign(this, {parentContainer, text, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines})

    this.innerLinePadding = 1 // TODO move up
  }

  computePreferredDimensions (estimatedWidth) {
    const lines = splitIntoLinesByWord({
      parentContainer: this.parentContainer,
      text: this.text,
      maxWidth: estimatedWidth,
      fontSize: this.fontSize,
      maxLines: this.maxLines,
      fontFamily: this.fontFamily
    })
    const lineDimensions = lines.map(text => getLabelDimensionsUsingSvgApproximation({
      text,
      parentContainer: this.parentContainer,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily
    }))

    return {
      width: _(lineDimensions).map('width').max(),
      height: _(lineDimensions).map('height').sum() + (lines.length - 1) * this.innerLinePadding
    }
  }

  draw (bounds) {
    const titleContainer = this.parentContainer.append('g')
      .classed('xtitle', true)
      .attr('transform', this.buildTransform(bounds))

    const lines = splitIntoLinesByWord({
      parentContainer: this.parentContainer,
      text: this.text,
      maxWidth: bounds.width,
      fontSize: this.fontSize,
      maxLines: this.maxLines,
      fontFamily: this.fontFamily
    })

    const textElement = titleContainer.append('text')
      .attr('transform', `translate(${bounds.width / 2}, 0)`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', 0)
      .style('text-anchor', 'middle')
      .style('dominant-baseline', 'text-before-edge')
      .style('font-weight', (this.bold) ? 'bold' : 'normal')
      .style('font-size', this.fontSize)
      .style('fill', this.fontColor)
      .style('font-family', this.fontFamily)

    _(lines).each((lineText, i) => {
      textElement.append('tspan')
        .attr('x', 0)
        .attr('y', i * (this.fontSize + this.innerLinePadding))
        .text(lineText)
    })
  }
}

module.exports = XAxis
