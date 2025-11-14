Feature: Interactive Checkboxes
  As a user
  I want to toggle checkboxes in preview mode
  So that I can mark tasks as complete without editing the markdown source

  Scenario: Toggle an unchecked checkbox
    Given I am viewing the "Getting Started" page
    And I am in preview mode
    When I click the checkbox for "Read this getting started guide"
    Then the checkbox should be checked
    And the markdown should be updated with "[x]" for that item
    And the changes should be saved automatically

  Scenario: Toggle a checked checkbox
    Given I am viewing the "Getting Started" page
    And I am in preview mode
    And the checkbox for "This is a nested checked item" is checked
    When I click the checkbox for "This is a nested checked item"
    Then the checkbox should be unchecked
    And the markdown should be updated with "[ ]" for that item
    And the changes should be saved automatically

  Scenario: Toggle nested checkbox
    Given I am viewing the "Getting Started" page
    And I am in preview mode
    When I click the checkbox for "This is a nested unchecked item"
    Then the checkbox should be checked
    And the markdown should be updated with "[x]" for that item
    And the changes should be saved automatically

  Scenario: Multiple checkbox toggles are debounced
    Given I am viewing the "Getting Started" page
    And I am in preview mode
    When I click the checkbox for "Explore the Markdown Guide"
    And I click the checkbox for "Create your first page"
    Then both checkboxes should be checked
    And the markdown should be updated for both items
    And only one save operation should occur

  Scenario: Checkboxes are always interactive in MDXEditor
    Given I am viewing the "Getting Started" page
    And I am in edit mode
    When I try to click a checkbox
    Then checkboxes should be present and interactive
    And I should see the markdown source editor

  Scenario: Page does not scroll after checkbox click
    Given I am viewing the "Getting Started" page
    And I am in preview mode
    And I scroll down the page
    When I click the checkbox for "Read this getting started guide"
    Then the page should not have scrolled
    And the checkbox should be checked

