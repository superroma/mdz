Feature: MDX View Components
  As a user
  I want to use view components in my pages
  So that I can visualize my data in different ways

  Scenario: MDX views workflow
    Given a parent page with a schema
    And child pages with field values
    And BoardView component in the parent content
    When I view the parent page
    Then I should see a board grouped by the specified field
    And each card should show the child page
    When I click a page title in the board
    Then I should navigate to that page
    Given a page with Tabs containing multiple views
    When I click a different tab
    Then I should see that view's content

