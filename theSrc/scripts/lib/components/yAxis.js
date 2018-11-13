import _ from 'lodash'
import d3 from 'd3'
import BaseComponent from './baseComponent'
import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils'

// TODO preferred dimensions must account for maxes
class YAxis extends BaseComponent{
  constructor ({parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight, controller}) {
    super()
    _.assign(this, {parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight, controller})
  }

  computePreferredDimensions () {
    const labelDimensions = this.labels.map(text => getLabelDimensionsUsingSvgApproximation(this.parentContainer, text, this.fontSize, this.fontFamily))
    return {
      width: _(labelDimensions).map('width').max() + this.padding,
      height: 0 // NB take what is provided
    }
  }

  draw (bounds) {
    const container = this.parentContainer.append('g').classed('axis yaxis', true).attr('transform', this.buildTransform(bounds))
    const rowHeight = bounds.height / this.labels.length

    const cells = container.selectAll('g')
      .data(this.labels)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(0,${rowHeight * i})`)

    cells.append('text')
      .style('opacity', 1)
      .style('font-size', this.fontSize)
      .style('fill', this.fontColor)
      .style('font-family', this.fontFamily)
      .attr('y', rowHeight / 2)
      .attr('dominant-baseline', 'middle')
      .style('text-anchor', 'start')
      .text(d => d)

    cells.append('rect')
      .classed('click-rect', true)
      .attr('width', bounds.width)
      .attr('height', rowHeight)
      .attr('fill', 'transparent')
      .attr('stroke', 'none')
      .on('click', (d, i) => {
        this.controller.yaxisClick(i)
        d3.event.stopPropagation()
      })
  }
}

module.exports = YAxis
