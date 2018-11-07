import BaseComponent from '../heatmapcore/baseComponent'
import _ from 'lodash'

// TODO preferred dimensions must account for maxes
class YTitle extends BaseComponent {
  constructor ({parentContainer, text, fontSize, fontFamily, fontColor, bold, maxWidth, maxHeight}) {
    super()
    _.assign(this, {parentContainer, text, fontSize, fontFamily, fontColor, bold, maxWidth, maxHeight})
  }

  computePreferredDimensions () {
    var dummySvg = this.parentContainer.append('svg')
    var dummy_g = dummySvg
      .append('g')
      .classed('dummy_g', true)

    var text_el = dummy_g.append('text')
      .text(this.text)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', 0)
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
      .style('fill', this.fontColor)
      .attr('font-weight', this.bold ? 'bold' : 'normal')

    var bbox = text_el.node().getBBox()
    dummySvg.remove()
    // note inversion of width / height here
    return {width: bbox.height, height: bbox.width}
  }

  draw (bounds) {
    const titleContainer = this.parentContainer.append('g').classed('ytitle', true).attr('transform', this.buildTransform(bounds))

    titleContainer.append('text')
      .text(this.text)
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', 0)
      .attr('transform', `translate(${bounds.width / 2},${bounds.height / 2}),rotate(-90)`)
      .style('font-weight', (this.bold) ? 'bold' : 'normal')
      .style('font-size', this.fontSize)
      .style('fill', this.fontColor)
      .style('font-family', this.fontFamily)
      .style('text-anchor', 'middle')
  }
}

module.exports = YTitle
