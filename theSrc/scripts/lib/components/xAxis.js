import _ from 'lodash'
import d3 from 'd3'
import BaseComponent from './baseComponent'
import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils'

const DEBUG = false

// TODO preferred dimensions must account for maxes
class XAxis extends BaseComponent {
  constructor ({parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight, rotation = -45, controller}) {
    super()
    _.assign(this, {parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight, rotation, controller})
  }

  computePreferredDimensions () {
    const labelDimensions = this.labels.map(text => getLabelDimensionsUsingSvgApproximation(this.parentContainer, text, this.fontSize, this.fontFamily, this.rotation))
    return {
      width: 0, // NB xaxis width takes what is given, and does not force width on the chart
      height: _(labelDimensions).map('height').max() + this.padding
    }
  }

  rotatingUp () {
    return this.rotation < 0
  }

  draw (bounds) {
    const container = this.parentContainer.append('g').classed('axis xaxis', true).attr('transform', this.buildTransform(bounds))

    const yOffsetCorrectionForRotation = (this.rotatingUp())
      ? bounds.height - this.padding
      : this.padding * 2 // TODO this is hacky
    const columnWidth = bounds.width / this.labels.length

    const cells = container.selectAll('g')
      .data(this.labels)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${columnWidth * i},0)`)

    cells.append('rect')
      .classed('click-rect', true)
      .attr('width', columnWidth)
      .attr('height', bounds.height)
      .attr('fill', 'transparent')
      .attr('stroke', (DEBUG) ? 'lightgrey' : 'transparent')
      .on('click', (d, i) => {
        console.log('rect click')
        this.controller.xaxisClick(i)
        d3.event.stopPropagation()
      })

    this.textSelection = cells.append('text')
      .classed('axis-text', true)
      .attr('transform', `translate(${columnWidth / 2 - this.fontSize / 2},${yOffsetCorrectionForRotation}),rotate(${this.rotation}),translate(${this.padding},0)`)
      .attr('x', 0)
      .attr('y', -this.padding)
      .text(d => d)
      .style('text-anchor', 'start')
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
      .on('click', (d, i) => {
        this.controller.xaxisClick(i)
        d3.event.stopPropagation()
      })
  }

  updateHighlights ({ column = null } = {}) {
    this.textSelection
      .classed('highlight', (d, i) => (column === i))
  }

  updateZoom ({ scale, translate, extent }) {
    console.log('{ scale, translate, extent }')
    console.log(JSON.stringify({ scale, translate, extent }, {}, 2))
  }
}

module.exports = XAxis

//
//
// controller.on('transform.axis-' + (rotated ? 'x' : 'y'), function (_) {
//   console.log(`axis controller.on(transform.axis-${(rotated ? 'x' : 'y')})`)
//   var dim = rotated ? 0 : 1
//   // scale.domain(leaves.slice(_.extent[0][dim], _.extent[1][dim]));
//   var rb = [_.translate[dim], (rotated ? width : height) * _.scale[dim] + _.translate[dim]]
//   scale.rangeBands(rb)
//   var tAxisNodes = axisNodes.transition().duration(opts.anim_duration).ease('linear')
//   tAxisNodes.call(axis)
//   // Set text-anchor on the non-transitioned node to prevent jumpiness
//   // in RStudio Viewer pane
//   // if (opts.table_style) {
//   //   axisNodes.selectAll("text").style("text-anchor", "start");
//   // } else {
//   axisNodes.selectAll('text').style('text-anchor', rotated ? 'start' : axis_location === 'right' ? 'start' : 'end')
//   // }
//
//   tAxisNodes.selectAll('g')
//     .style('opacity', function (d, i) {
//       if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
//         return 1
//       } else {
//         return 0
//       }
//     })
//   // if (opts.table_style) {
//   //   tAxisNodes.selectAll("text")
//   //     .style("text-anchor", "start");
//
//   // } else {
//   tAxisNodes.selectAll('text')
//     .style('text-anchor', rotated ? 'start' : axis_location === 'right' ? 'start' : 'end')
//   // }
//
//   mouseTargets.transition().duration(opts.anim_duration).ease('linear')
//     .call(layoutMouseTargets)
//     .style('opacity', function (d, i) {
//       if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
//         return 1
//       } else {
//         return 0
//       }
//     })
// })
