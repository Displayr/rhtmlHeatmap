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
      height: _(labelDimensions).map('height').sum()
    }
  }

  draw (bounds) {
    const container = this.parentContainer.append('g').classed('axis yaxis', true).attr('transform', this.buildTransform(bounds))

    // set axis options
    const scale = d3.scale.ordinal()
      .domain(d3.range(0, this.labels.length))
      .rangeBands([0, bounds.height])

    const axis = d3.svg.axis()
      .scale(scale)
      .orient('left')
      .outerTickSize(0)
      .innerTickSize(0)
      .tickPadding(0)
      .tickFormat((d, i) => this.labels[i]) // hack for repeated values

    // Create the actual axis
    const axisNodes = container.append('g')
      .call(axis)

    axisNodes.selectAll('text')
      .style('text-anchor', 'start')
      .style('opacity', 1)
      .style('font-size', this.fontSize)
      .style('font-family', this.fontFamily)

    axisNodes.selectAll('.tick')
      .on('click', (d) => {
        this.controller.yaxisClick(d)
        d3.event.stopPropagation()
      })
  }
}

module.exports = YAxis
