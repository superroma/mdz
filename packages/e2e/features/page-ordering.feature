Feature: Page Ordering
  As a user
  I want to reorder pages by dragging them
  So that I can organize my content in a custom order

  Scenario: Pages appear in order defined by .pages.yaml
    Given a .pages.yaml file exists with custom order
    When I visit the root URL "/"
    Then pages should appear in the defined order

  Scenario: Reorder pages via drag and drop
    Given I am on the home page
    When I drag a page to a new position
    Then the page order should be updated
    And the new order should persist after reload

  Scenario: Unlisted pages appear at the end alphabetically
    Given a .pages.yaml file with partial order
    When I visit the root URL "/"
    Then listed pages appear first in specified order
    And unlisted pages appear after in alphabetical order

  Scenario: Hidden pages are excluded from ordering
    Given I am on the home page with show hidden enabled
    When I try to drag a hidden page
    Then the hidden page should not be draggable
