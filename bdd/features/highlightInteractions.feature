@applitools @heatmap @rowFocus
Feature: Highlight Interactions

  Clicking on a row in the y axis will highlight and unhighlight the row

  Scenario: Scenario: User can highlight a row
    Given I am viewing "data.minimal_3x3_standalone" with dimensions 650x650
    And I click row 2 name
    Then Sleep 700 milliseconds
    Then the "row_highlight_interaction_minimal_3x3_highlight_row_2" snapshot matches the baseline
    When I click row 2 name
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_minimal_3x3_unhighlight_row_2" snapshot matches the baseline

# TODO add coverage
# when i click anywhere it unhighlights
# same tests for column highlighting
# I can highlight a column and a row at same time
# when i click a different row/column the focus changes