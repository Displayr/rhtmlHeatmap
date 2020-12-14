import LabelUtilsWrapper from './labelUtilsWrapper'
import { enums } from 'rhtmlLabelUtils'

class VerticalBottomToTopWrappedLabel extends LabelUtilsWrapper {
  constructor ({
    verticalAlignment = enums.verticalAlignment.BOTTOM,
    horizontalAlignment = enums.horizontalAlignment.CENTER,
    ...rest
  }) {
    super({
      verticalAlignment,
      horizontalAlignment,
      orientation: enums.orientation.BOTTOM_TO_TOP,
      ...rest,
    })
  }
}

module.exports = VerticalBottomToTopWrappedLabel
