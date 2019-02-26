@applitools @heatmap @zoom
Feature: Zoom Interactions

  Zooming in and out on the heatmap

  Scenario: Scenario: User can zoom in and out
    Given I am viewing "data.minimal_3x3_standalone_with_columns" with dimensions 950x650
    And I zoom from 0x0 to 1x1
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_minimal_3x3_zoomed_on_0x0_to_1x1" snapshot matches the baseline
    When I click on cell 0x0
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_minimal_3x3_zoom_back_out" snapshot matches the baseline

    And I zoom from 1x1 to 2x2
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_minimal_3x3_zoomed_on_1x1_to_2x2" snapshot matches the baseline
    When I click on cell 1x1
    Then Sleep 700 milliseconds

    And I zoom from 0x0 to 0x2
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_minimal_3x3_zoomed_on_0x0_to_0x2" snapshot matches the baseline
    When I click on cell 0x0
    Then Sleep 700 milliseconds

    And I zoom from 0x0 to 2x0
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_minimal_3x3_zoomed_on_0x0_to_2x0" snapshot matches the baseline
    When I click on cell 0x0
    Then Sleep 700 milliseconds

  Scenario: Scenario: User can zoom in and out - axis variations
    Given I am viewing "data.minimal_3x3_standalone_with_columns|config.xaxis_bottom|config.yaxis_right" with dimensions 950x650
    And I zoom from 0x0 to 1x1
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_axis_variation_minimal_3x3_zoomed_on_0x0_to_1x1" snapshot matches the baseline
    When I click on cell 0x0
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_axis_variation_minimal_3x3_zoom_back_out" snapshot matches the baseline

    And I zoom from 1x1 to 2x2
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_axis_variation_minimal_3x3_zoomed_on_1x1_to_2x2" snapshot matches the baseline
    When I click on cell 1x1
    Then Sleep 700 milliseconds

    And I zoom from 0x0 to 0x2
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_axis_variation_minimal_3x3_zoomed_on_0x0_to_0x2" snapshot matches the baseline
    When I click on cell 0x0
    Then Sleep 700 milliseconds

    And I zoom from 0x0 to 2x0
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_axis_variation_minimal_3x3_zoomed_on_0x0_to_2x0" snapshot matches the baseline
    When I click on cell 0x0
    Then Sleep 700 milliseconds


