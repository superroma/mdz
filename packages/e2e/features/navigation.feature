Feature: Page Navigation
  As a user
  I want to navigate between pages
  So that I can view different content

  Scenario: Root URL redirects to first page
    When I visit the root URL "/"
    Then I should be redirected to the first page

  Scenario: Navigate via sidebar
    Given I am on a page
    When I click a different page in the sidebar
    Then I should see that page's content
    And the URL should update to match the page path

  Scenario: Deep linking
    When I visit a direct page URL "/p/Welcome/Tasks/Write Tests"
    Then I should see the "Write Tests" page content
    And the sidebar should highlight that page

  Scenario: Breadcrumb navigation
    Given I am viewing a nested page
    When I click a parent breadcrumb
    Then I should navigate to that parent page

  Scenario: Back button
    Given I have navigated through multiple pages
    When I click the back button
    Then I should return to the previous page

