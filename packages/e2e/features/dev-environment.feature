Feature: Development Environment
  As a developer
  I want the app to load with seed pages
  So that I can see examples immediately

  Scenario: Running dev server loads seed pages
    When I run "npm run dev"
    And I visit the application
    Then I should see the Welcome page
    And the sidebar should show all seed pages

  Scenario: Seed pages are functional
    Given the dev server is running
    When I navigate to the Tasks page
    Then I should see the BoardView component
    And I should see child task pages

