@applitools @rerender
Feature: Multiple Calls to Render Value

  Multiple calls to renderValue should leave the widget in a good state. Updates to the config should be rendered, and there should not be multiple widgets created or remnants of the original config left over.

  Scenario: Rerender Test
    Given I am viewing "data.minimal_3x3_standalone" with dimensions 600x600 and rerender controls
    Then the "rerender_minimal_3x3_standalone" snapshot matches the baseline
    When I rerender with config "displayr_regression_cases.dendrogram"
    Then the "rerender_dendrogram" snapshot matches the baseline
