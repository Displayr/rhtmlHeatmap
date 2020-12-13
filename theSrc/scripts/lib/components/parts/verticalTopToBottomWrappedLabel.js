import LabelUtilsWrapper from './labelUtilsWrapper'
import { enums } from 'rhtmlLabelUtils'

class VerticalTopToBottomWrappedLabel extends LabelUtilsWrapper {
  constructor ({
    ...rest
  }) {
    super({
      verticalAlignment: enums.verticalAlignment.TOP,
      horizontalAlignment: enums.horizontalAlignment.CENTER,
      orientation: enums.orientation.TOP_TO_BOTTOM,
      ...rest,
    })
  }
}

module.exports = VerticalTopToBottomWrappedLabel
