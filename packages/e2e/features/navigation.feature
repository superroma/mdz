Feature: Page Navigation
  As a user
  I want to navigate between pages
  So that I can view different content

  Scenario: Complete navigation workflow
    When I visit the root URL "/"
    Then I should be redirected to the first page
    When I click a different page in the sidebar
    Then I should see that page's content
    And the URL should update to match the page path
    When I have navigated through multiple pages
    And I click the back button
    Then I should return to the previous page

  Scenario: Direct navigation and breadcrumbs
    When I visit a direct page URL "/p/Welcome/Tasks/Write Tests"
    Then I should see the "Write Tests" page content
    And the sidebar should highlight that page
    When I am viewing a nested page
    And I click a parent breadcrumb
    Then I should be navigated to parent page

  Scenario: App starts on first visible page not first page
    When I visit the root URL "/"
    Then I should be redirected to the first visible page
    And I should not be redirected to a hidden page

