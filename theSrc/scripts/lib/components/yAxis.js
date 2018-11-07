import BaseComponent from '../heatmapcore/baseComponent'
import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils'
import _ from 'lodash'
import d3 from 'd3'

// TODO preferred dimensions must account for maxes
class YAxis extends BaseComponent{
  constructor ({parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight}) {
    super()
    _.assign(this, {parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight})
  }

  computePreferredDimensions () {
    const labelDimensions = this.labels.map(text => getLabelDimensionsUsingSvgApproximation(this.parentContainer, text, this.fontSize, this.fontFamily))
    return {
      width: _(labelDimensions).map('width').max() + this.padding,
      height: _(labelDimensions).map('height').sum()
    }
  }

  draw (bounds) {
    // TODO clean up this D3 sequence
    this.parentContainer.append('g').classed('axis yaxis', true).attr('transform', this.buildTransform(bounds))
    const axisContainer = this.parentContainer.select('g.yaxis').append('g')

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
    const axisNodes = axisContainer.append('g')
      .call(axis)

    axisNodes.selectAll('text')
      .style('text-anchor', 'start')
      .style('opacity', 1)
      .style('font-size', this.fontSize)
      .style('font-family', this.fontFamily)
  }
}

module.exports = YAxis
