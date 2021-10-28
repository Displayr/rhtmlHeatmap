import BaseComponent from './baseComponent'
import Utils from './utils'
import d3 from 'd3'
import _ from 'lodash'

const validLabelFormatValues = ['normal', 'percentage']

class Legend extends BaseComponent {
  constructor ({ parentContainer, colors, range, digits, fontSize, fontFamily, fontColor, leftSpace, barWidth, xPadding, labelFormat }) {
    super()
    _.assign(this, { parentContainer, colors, range, digits, fontSize, fontFamily, fontColor, leftSpace, barWidth, xPadding, labelFormat })

    if (!_.includes(validLabelFormatValues, this.labelFormat)) {
      throw new Error(`Invalid labelFormat '${this.labelFormat}: valid values : ${validLabelFormatValues}`)
    }
  }

  makeD3Format (digits, labelFormat) {
    // http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e <-- NB how d3.format works interactive example
    const formatCodes = { normal: 'f', percentage: '%' }
    return d3.format(`,.${digits}${formatCodes[labelFormat]}`)
  }

  // NB this actually does two things (yay side effects)
  //  1: compute preferred dimensions
  //  2: compute and save this.legend_format <-- requires (in some cases) knowing the tick count, which requires drawing the axis
  computePreferredDimensions () {
    const dummySvg = this.parentContainer.append('svg')
    const legendAxisG = dummySvg.append('g')

    dummySvg.selectAll('rect').data(this.colors)

    const rectHeight = 10 // NB this is just placeholder as we are only interested in computing width

    const legendScale = d3.scale.linear()
      .domain(this.range)
      .range([this.colors.length * rectHeight, 0])

    const legendAxis = d3.svg.axis()
      .scale(legendScale)
      .orient('right')
      .tickSize(0)

    legendAxisG.call(legendAxis)
    let digits = this.digits || this.computeLegendDigits(legendAxisG.selectAll('text')[0].length)
    this.legend_format = this.makeD3Format(digits, this.labelFormat)

    legendAxis.tickFormat(this.legend_format)
    legendAxisG.call(legendAxis)

    let textWidths = []
    legendAxisG.selectAll('text')
      .style('font-size', Utils.fontSizeInPx(this.fontSize))
      .style('font-family', this.fontFamily)
      .style('fill', this.fontColor)
      .each(function () { textWidths.push(this.getComputedTextLength()) })

    const totalWidth = this.leftSpace +
      this.barWidth +
      this.xPadding +
      d3.max(textWidths)

    dummySvg.remove()
    return { width: totalWidth, height: 0 } // we just accept whatever height is given
  }

  draw (bounds) {
    const boundsPaddingY = 20
    const rectWidth = this.barWidth
    const rectHeight = (bounds.height - boundsPaddingY * 2) / this.colors.length

    const container = this.parentContainer.append('g').classed('legend', true).attr('transform', this.buildTransform(bounds))
    const legendBars = container.append('g').classed('legendBars', true).attr('transform', `translate(${this.leftSpace},${boundsPaddingY})`)
    const legendLabels = container.append('g').classed('legendLabels', true).attr('transform', `translate(${this.leftSpace + rectWidth + this.xPadding},${boundsPaddingY})`)

    legendBars.selectAll('rect')
      .data(this.colors)
      .enter()
      .append('rect')
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('transform', (d, i) => `translate(0,${rectHeight * i})`)
      .style('fill', (d) => d)
      .style('stroke', (d) => d)
      .style('stroke-width', '1px')

    const legendScale = d3.scale.linear()
      .domain(this.range)
      .range([this.colors.length * rectHeight, 0])

    const legendAxis = d3.svg.axis()
      .scale(legendScale)
      .orient('right')
      .tickFormat(this.legend_format)

    legendLabels.call(legendAxis)
    legendLabels.selectAll('text')
      .attr('x', 0)
      .style('font-size', Utils.fontSizeInPx(this.fontSize))
      .style('font-family', this.fontFamily)
      .style('fill', this.fontColor)
  }

  computeLegendDigits (legendTicksCount) {
    const legendStep = (d3.max(this.range) - d3.min(this.range)) / (legendTicksCount - 1)
    let digits = Math.max(0, -1 * Math.floor(Math.log(legendStep) / Math.log(10)))
    if (this.labelFormat === 'percentage') {
      digits = Math.max(0, digits - 2)
    }
    return digits
  }
}

module.exports = Legend
