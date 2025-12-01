Feature: Markdown Resilience
  As a user
  I want pages to never crash the application
  So that I can view any content gracefully even if some parts fail

  Scenario: Page with problematic markdown renders without crashing
    Given I have a page with all known problematic markdown patterns
    When I view the page
    Then the application should not crash
    And the page should be navigable
    And I should be able to interact with the UI
