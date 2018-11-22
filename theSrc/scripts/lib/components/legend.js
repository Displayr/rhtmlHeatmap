import BaseComponent from './baseComponent'
import d3 from 'd3'
import _ from 'lodash'

class Legend extends BaseComponent {
  constructor ({parentContainer, colors, range, digits, fontSize, fontFamily, fontColor, leftSpace, barWidth, xPadding, labelFormat}) {
    super()
    _.assign(this, {parentContainer, colors, range, digits, fontSize, fontFamily, fontColor, leftSpace, barWidth, xPadding, labelFormat})
  }

  computePreferredDimensions () {
    const dummySvg = this.parentContainer.append('svg')
    const legendAxisG = dummySvg.append('g')

    dummySvg.selectAll('rect').data(this.colors)

    const rectHeight = 10

    const legendScale = d3.scale.linear().range([this.colors.length * rectHeight, 0]).nice()

    legendScale.domain(this.range)

    const legendAxis = d3.svg.axis()
      .scale(legendScale)
      .orient('right')
      .tickSize(0)

    legendAxisG.call(legendAxis)
    const legendTicksCount = legendAxisG.selectAll('text')[0].length

    if (this.colors) {
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
    // http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e <-- figure out how d3.format works
    if (this.labelFormat) {
      this.legend_format = d3.format(',.1%')
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
      this.xPadding +
      d3.max(text_widths)

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

    const legendScale = d3.scale.linear().range([this.colors.length * rectHeight, 0]).nice()
    legendScale.domain(this.range)

    const legendAxis = d3.svg.axis()
      .scale(legendScale)
      .orient('right')
      .tickSize(0)
      .tickFormat(this.legend_format)

    legendLabels.call(legendAxis)
    legendLabels.selectAll('text')
      .attr('x', 0)
      .style('font-size', this.fontSize + 'px')
      .style('font-family', this.fontFamily)
      .style('fill', this.fontColor)
  }
}

module.exports = Legend
