Feature: Responsive Design
  As a mobile user
  I want the interface to adapt to my screen size
  So that I can use the app on any device

  Scenario: Desktop shows sidebar
    Given I am using a desktop screen size
    Then the sidebar should be visible
    And the hamburger button should be hidden

  Scenario: Mobile hides sidebar by default
    Given I am using a mobile screen size
    Then the sidebar should be hidden
    And the hamburger button should be visible

  Scenario: Mobile hamburger toggles sidebar
    Given I am using a mobile screen size
    And the sidebar is hidden
    When I click the hamburger button
    Then the sidebar should become visible

