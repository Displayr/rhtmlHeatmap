import LabelUtilsWrapper from './labelUtilsWrapper'
import { enums } from 'rhtmlLabelUtils'

class HorizontalWrappedLabel extends LabelUtilsWrapper {
  constructor ({
    verticalAlignment = enums.verticalAlignment.TOP,
    horizontalAlignment = enums.horizontalAlignment.CENTER,
    ...rest
  }) {
    super({
      verticalAlignment,
      horizontalAlignment,
      orientation: enums.orientation.HORIZONTAL,
      ...rest,
    })
  }
}

module.exports = HorizontalWrappedLabel
