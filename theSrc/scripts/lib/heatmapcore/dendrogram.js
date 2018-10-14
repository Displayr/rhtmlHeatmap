import d3 from 'd3'

function dendrogram (svg, data, rotated, width, height, padding, linkColor, controller, animDuration) {
  console.log(`making the dendrogram`)
  var topLineWidth = maxChildStrokeWidth(data, false)

  var x = d3.scale.linear()
    .domain([data.height, 0])
    .range([topLineWidth / 2, width - padding])
  var y = d3.scale.linear()
    .domain([0, height])
    .range([0, height])

  var cluster = d3.layout.cluster()
    .separation(function (a, b) { return 1 })
    .size([rotated ? width : height, NaN])

  var transform = 'translate(1,0)'
  if (rotated) {
    // Flip dendrogram vertically
    x.range([topLineWidth / 2, -height + padding + 2])
    // Rotate
    transform = 'rotate(-90) translate(-2,0)'
  }

  var dendrG = svg
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', transform)

  var nodes = cluster.nodes(data)
  var links = cluster.links(nodes)

  // I'm not sure why, but after the heatmap loads the "links"
  // array mutates to much smaller values. I can't figure out
  // what's doing it, so instead we just make a deep copy of
  // the parts we want.
  var links1 = links.map(function (link, i) {
    return {
      source: {x: link.source.x, y: link.source.height},
      target: {x: link.target.x, y: link.target.height},
      edgePar: link.target.edgePar
    }
  })

  var lines = dendrG.selectAll('polyline').data(links1)
  lines
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
      var pattern
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

  function draw (selection) {
    function elbow (d, i) {
      return x(d.source.y) + ',' + y(d.source.x) + ' ' +
        x(d.source.y) + ',' + y(d.target.x) + ' ' +
        x(d.target.y) + ',' + y(d.target.x)
    }

    selection
      .attr('points', elbow)
  }

  controller.on('transform.dendr-' + (rotated ? 'x' : 'y'), function (_) {
    var scaleBy = _.scale[rotated ? 0 : 1]
    var translateBy = _.translate[rotated ? 0 : 1]
    y.range([translateBy, height * scaleBy + translateBy])
    draw(lines.transition().duration(animDuration).ease('linear'))
  })

  draw(lines)
}

function maxChildStrokeWidth (node, recursive) {
  var max = 0
  for (var i = 0; i < node.children.length; i++) {
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

module.exports = dendrogram
