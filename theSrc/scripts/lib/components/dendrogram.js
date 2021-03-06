import BaseComponent from './baseComponent'
import { CellNames } from '../heatmapcore/layout'
import d3 from 'd3'
import _ from 'lodash'

class Dendrogram extends BaseComponent {
  constructor ({ parentContainer, data, width, height, type, linkColor, animDuration }) {
    super()
    _.assign(this, { parentContainer, data, width, height, type, linkColor, animDuration })
  }

  computePreferredDimensions () {
    return { width: this.width || 0, height: this.height || 0 }
  }

  draw (bounds) {
    this.bounds = bounds
    const container = this.parentContainer
      .append('g')
      .classed('dendrogram-container', true)
      .attr('transform', this.buildTransform(bounds))
      .append('svg')
      .classed('dendrogram', true)
      .attr('width', bounds.width)
      .attr('height', bounds.height)

    const { data, linkColor } = this
    const { width, height } = bounds

    const rotated = (this.type === CellNames.TOP_DENDROGRAM)
    const topLineWidth = maxChildStrokeWidth(data, false)

    const x = d3.scale.linear()
      .domain([data.height, 0])
      .range([topLineWidth / 2, width])
    const y = d3.scale.linear()
      .domain([0, height])
      .range([0, height])

    this.scales = { x, y }

    const cluster = d3.layout.cluster()
      .separation(function (a, b) { return 1 })
      .size([rotated ? width : height, NaN])

    let transform = 'translate(1,0)'
    if (rotated) {
      // Flip dendrogram vertically
      x.range([topLineWidth / 2, -height + 2])
      // Rotate
      transform = 'rotate(-90) translate(-2,0)'
    }

    const dendrG = container
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', transform)

    const nodes = cluster.nodes(data)
    const links = cluster.links(nodes)

    // I'm not sure why, but after the heatmap loads the "links"
    // array mutates to much smaller values. I can't figure out
    // what's doing it, so instead we just make a deep copy of
    // the parts we want.
    const links1 = links.map(function (link, i) {
      return {
        source: { x: link.source.x, y: link.source.height },
        target: { x: link.target.x, y: link.target.height },
        edgePar: link.target.edgePar,
      }
    })

    this.lines = dendrG.selectAll('polyline').data(links1)
    this.lines
      .enter().append('polyline')
      .attr('class', 'link')
      .attr('stroke', function (d, i) {
        if (!d.edgePar.col) {
          return linkColor
        } else {
          return d.edgePar.col
        }
      })
      .attr('stroke-width', edgeStrokeWidth)
      .attr('stroke-dasharray', function (d, i) {
        let pattern
        switch (d.edgePar.lty) {
          case 6:
            pattern = [3, 3, 5, 3]
            break
          case 5:
            pattern = [15, 5]
            break
          case 4:
            pattern = [2, 4, 4, 4]
            break
          case 3:
            pattern = [2, 4]
            break
          case 2:
            pattern = [4, 4]
            break
          case 1:
          default:
            pattern = []
            break
        }
        for (let i = 0; i < pattern.length; i++) {
          pattern[i] = pattern[i] * (d.edgePar.lwd || 1)
        }
        return pattern.join(',')
      })

    this._draw(this.lines)
  }

  _draw (selection) {
    const elbow = (d, i) => {
      return this.scales.x(d.source.y) + ',' + this.scales.y(d.source.x) + ' ' +
        this.scales.x(d.source.y) + ',' + this.scales.y(d.target.x) + ' ' +
        this.scales.x(d.target.y) + ',' + this.scales.y(d.target.x)
    }

    selection
      .attr('points', elbow)
  }

  updateZoom ({ scale, translate }) {
    const rotated = (this.type === CellNames.TOP_DENDROGRAM)
    const scaleBy = scale[rotated ? 0 : 1]
    const translateBy = translate[rotated ? 0 : 1]
    this.scales.y.range([translateBy, this.bounds.height * scaleBy + translateBy])
    this._draw(this.lines.transition().duration(this.animDuration).ease('linear'))
  }
}

function maxChildStrokeWidth (node, recursive) {
  let max = 0
  for (let i = 0; i < node.children.length; i++) {
    if (recursive) {
      max = Math.max(max, maxChildStrokeWidth(node.children[i], true))
    }
    max = Math.max(max, edgeStrokeWidth(node.children[i]))
  }
  return max
}

function edgeStrokeWidth (node) {
  if (node.edgePar && node.edgePar.lwd) {
    return node.edgePar.lwd
  } else {
    return 1
  }
}

module.exports = Dendrogram
