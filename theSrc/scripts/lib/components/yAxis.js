import _ from 'lodash'
import d3 from 'd3'
import BaseComponent from './baseComponent'
import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils'
import { CellNames } from '../heatmapcore/layout'

// TODO preferred dimensions must account for maxes
class YAxis extends BaseComponent {
  constructor ({parentContainer, placement, labels, fontSize, fontFamily, maxWidth, maxHeight, controller}) {
    super()
    _.assign(this, {parentContainer, placement, labels, fontSize, fontFamily, maxWidth, maxHeight, controller})

    // to deal with superflous zoom calls at beginning of render
    this.amIZoomed = false
  }

  computePreferredDimensions () {
    const labelDimensions = this.labels.map(text => getLabelDimensionsUsingSvgApproximation(this.parentContainer, text, this.fontSize, this.fontFamily))
    return {
      width: _(labelDimensions).map('width').max(),
      height: 0 // NB take what is provided
    }
  }

  draw (bounds) {
    this.bounds = bounds
    const container = this.parentContainer.append('g').classed('axis yaxis', true).attr('transform', this.buildTransform(bounds))
    const rowHeight = bounds.height / this.labels.length

    this.cellSelection = container.selectAll('g')
      .data(this.labels)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(0,${rowHeight * i})`)

    this.rectSelection = this.cellSelection.append('rect')
      .classed('click-rect', true)
      .attr('width', bounds.width)
      .attr('height', rowHeight)
      .attr('fill', 'transparent')
      .attr('stroke', 'transparent')
      .on('click', (d, i) => {
        this.controller.yaxisClick(i)
        d3.event.stopPropagation()
      })

    this.textSelection = this.cellSelection.append('text')
      .classed('axis-text', true)
      .style('font-size', this.fontSize)
      .style('fill', this.fontColor)
      .style('font-family', this.fontFamily)
      .attr('width', bounds.width)
      .attr('x', (this.placement === CellNames.LEFT_YAXIS) ? bounds.width : 0)
      .attr('y', rowHeight / 2)
      .attr('dominant-baseline', 'middle')
      .style('text-anchor', (this.placement === CellNames.LEFT_YAXIS) ? 'end' : 'start')
      .text(d => d)
      .on('click', (d, i) => {
        this.controller.yaxisClick(i)
        d3.event.stopPropagation()
      })
  }

  updateHighlights ({ row = null } = {}) {
    this.textSelection
      .classed('highlight', (d, i) => (row === i))
  }

  // TODO better field for 'zoom'
  updateZoom ({ scale, translate, extent, zoom }) {
    if (!zoom && !this.amIZoomed) {
      return
    }
    if (zoom && this.amIZoomed) {
      return
    }
    this.amIZoomed = zoom
    if (this.amIZoomed) {
      return this.applyZoom({scale, translate, extent})
    } else {
      return this.resetZoom()
    }
  }

  applyZoom ({scale, translate, extent}) {
    const rowsInZoom = _.range(extent[0][1], extent[1][1])
    const inFocusExtent = rowsInZoom.length
    const numberCellsAboveOutOfFocus = extent[0][1]
    const newCellHeight = this.bounds.height / inFocusExtent
    const newStartingPoint = -1 * numberCellsAboveOutOfFocus * newCellHeight

    this.cellSelection
      .attr('transform', (d, i) => `translate(0,${newStartingPoint + newCellHeight * i})`)

    this.rectSelection
      .attr('height', newCellHeight)

    this.textSelection
      .attr('y', newCellHeight / 2)
      .classed('in-zoom', (d, i) => _.includes(rowsInZoom, i))
  }

  resetZoom () {
    const rowHeight = this.bounds.height / this.labels.length
    this.cellSelection
      .attr('transform', (d, i) => `translate(0,${rowHeight * i})`)

    this.rectSelection
      .attr('height', rowHeight)

    this.textSelection
      .attr('y', rowHeight / 2)
      .classed('in-zoom', false)
  }
}

module.exports = YAxis
