import BaseComponent from './baseComponent'
import d3 from 'd3'
import _ from 'lodash'

class Legend extends BaseComponent {
  constructor ({parentContainer, colors, x_is_factor, range, digits, fontSize, fontFamily, fontColor, leftSpace, barWidth, xPadding}) {
    super()
    _.assign(this, {parentContainer, colors, x_is_factor, range, digits, fontSize, fontFamily, fontColor, leftSpace, barWidth, xPadding})
  }

  computePreferredDimensions () {
    const dummySvg = this.parentContainer.append('svg')
    const legendAxisG = dummySvg.append('g')

    dummySvg.selectAll('rect').data(this.colors)

    const rectHeight = 10

    const legendScale = (this.x_is_factor)
      ? d3.scale.ordinal().rangeBands([this.colors.length * rectHeight, 0]).nice()
      : d3.scale.linear().range([this.colors.length * rectHeight, 0]).nice()

    legendScale.domain(this.range)

    const legendAxis = d3.svg.axis()
      .scale(legendScale)
      .orient('right')
      .tickSize(0)

    legendAxisG.call(legendAxis)
    const legendTicksCount = legendAxisG.selectAll('text')[0].length

    if (this.colors && !this.x_is_factor) {
      if (this.digits) {
        this.legend_format = d3.format(',.' + this.digits + 'f')
      } else {
        const legend_step = (d3.max(this.range) - d3.min(this.range)) / (legendTicksCount - 1)
        let legend_dig
        if (legend_step < 0.1) {
          legend_dig = -Math.floor(Math.log(legend_step) / Math.log(10) + 1) + 1
        } else if (legend_step >= 0.1 && legend_step < 1) {
          legend_dig = 1
        } else {
          legend_dig = 0
        }
        this.legend_format = d3.format(',.' + legend_dig + 'f')
      }
    }

    legendAxis.tickFormat(this.legend_format)
    legendAxisG.call(legendAxis)

    let text_widths = []
    legendAxisG.selectAll('text')
      .style('font-size', this.fontSize + 'px')
      .style('font-family', this.fontFamily)
      .style('fill', this.fontColor)
      .each(function () { text_widths.push(this.getComputedTextLength()) })

    const totalWidth = this.leftSpace +
      this.barWidth +
      this.xPadding * 2 +
      d3.max(text_widths)

    dummySvg.remove()
    return { width: totalWidth, height: 0 } // we just accept whatever height is given
  }

  draw (bounds) {
    const boundsPaddingX = 4 + this.leftSpace
    const boundsPaddingY = 20
    const rectWidth = this.barWidth
    const rectHeight = (bounds.height - boundsPaddingY * 2) / this.colors.length

    const container = this.parentContainer.append('g').classed('legend', true).attr('transform', this.buildTransform(bounds))
    const legendAxisG = container.append('g').attr('transform', `translate(${boundsPaddingX},${boundsPaddingY})`)

    legendAxisG.selectAll('rect')
      .data(this.colors)
      .enter()
      .append('rect')
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('transform', (d, i) => `translate(${boundsPaddingX},${rectHeight * i + boundsPaddingY})`)
      .style('fill', (d) => d)
      .style('stroke', (d) => d)
      .style('stroke-width', '1px')

    const legendScale = (this.x_is_factor)
      ? d3.scale.ordinal().rangeBands([this.colors.length * rectHeight, 0]).nice()
      : d3.scale.linear().range([this.colors.length * rectHeight, 0]).nice()

    legendScale.domain(this.range)

    const legendAxis = d3.svg.axis()
      .scale(legendScale)
      .orient('right')
      .tickSize(0)
      .tickFormat(this.legend_format)

    legendAxisG.call(legendAxis)
    legendAxisG.selectAll('text')
      .style('font-size', this.fontSize + 'px')
      .style('font-family', this.fontFamily)
      .style('fill', this.fontColor)
  }
}

module.exports = Legend
