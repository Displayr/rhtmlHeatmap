let uniqueId = 0
function getUniqueId () { return uniqueId++ }
function toRadians (degrees) { return degrees * (Math.PI / 180) }

function getLabelDimensionsUsingSvgApproximation (parentContainer, inputString, fontSize, fontFamily, rotation = 0) {
  const uniqueId = `tempLabel-${getUniqueId()}`

  const container = parentContainer.append('g')
    .attr('class', 'tempLabel')
    .attr('id', uniqueId)

  const text = container.append('text')
    .style('dominant-baseline', 'text-before-edge')
    .attr('x', 0)
    .attr('y', 0)
    .attr('dy', 0)
    .attr('transform', `rotate(${rotation})`)

  text.append('tspan')
    .attr('x', 0)
    .attr('y', 0)
    .style('font-size', `${fontSize}px`)
    .style('font-family', fontFamily)
    .style('dominant-baseline', 'text-before-edge')
    .text(inputString)

  const {x, y, width: unadjustedWidth, height: unadjustedHeight} = text.node().getBBox()

  // NB on some window sizes getBBox will return negative y offsets. Add them to returned value for consistent behaviour
  // across all window sizes
  const unrotatedWidth = unadjustedWidth + x
  const unrotatedHeight = unadjustedHeight + y

  parentContainer.selectAll(`#${uniqueId}`).remove()

  const angleInRads = toRadians(Math.abs(rotation))
  const height = Math.sin(angleInRads) * unrotatedWidth + Math.cos(angleInRads) * unrotatedHeight
  const width = Math.cos(angleInRads) * unrotatedWidth + Math.sin(angleInRads) * unrotatedHeight
  const xOffset = (rotation > 0) ? -1 * Math.sin(angleInRads) * unrotatedHeight : 0
  const yOffset = (rotation < 0) ? -1 * Math.sin(angleInRads) * unrotatedWidth : 0

  return { width, height, xOffset, yOffset }
}

module.exports = {
  getLabelDimensionsUsingSvgApproximation
}
