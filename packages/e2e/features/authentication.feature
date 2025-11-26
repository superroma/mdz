Feature: Authentication and Access Control

  Background:
    Given seed pages are loaded in a temporary test directory
    And the backend is configured to use the test directory
    And authentication is enabled with test users

  Scenario: Unauthenticated requests are rejected
    When I make an unauthenticated request to "/api/pages"
    Then the response status should be 404

  Scenario: Admin user can access all pages
    Given I am authenticated as an admin user
    When I request the page list
    Then I should receive all pages

  Scenario: Regular user can only see accessible pages
    Given I am authenticated as a regular user
    And a page "public" with default access exists
    And a page "restricted" with admin-only access exists
    When I request the page list
    Then I should see "public" in the list
    And I should not see "restricted" in the list

  Scenario: User cannot access restricted pages directly
    Given I am authenticated as a regular user
    And a page "restricted" with admin-only access exists
    When I request the page "restricted"
    Then the response status should be 404

  Scenario: Admin can edit any page
    Given I am authenticated as an admin user
    And a page "test" exists
    When I update the page "test" with new content
    Then the page should be updated successfully

  Scenario: Regular user cannot edit restricted pages
    Given I am authenticated as a regular user
    And a page "restricted" with admin-only access exists
    When I try to update the page "restricted"
    Then the response status should be 404

  Scenario: Access rights are inherited from parent pages
    Given I am authenticated as a regular user
    And a page "parent" with admin-only access exists
    And a page "parent/child" exists
    When I request the page "parent/child"
    Then the response status should be 404

  Scenario: Child pages can override parent access rights
    Given I am authenticated as a regular user
    And a page "parent" with admin-only access exists
    And a page "parent/child" with public access exists
    When I request the page "parent/child"
    Then the page should be accessible

  Scenario: Users in everyone group can access default pages
    Given I am authenticated as a regular user
    And a page "default" exists
    When I request the page "default"
    Then the page should be accessible

  Scenario: File operations respect page permissions
    Given I am authenticated as a regular user
    And a page "restricted" with admin-only access exists
    When I try to upload a file to "restricted"
    Then the response status should be 404

  Scenario: Admin can create pages anywhere
    Given I am authenticated as an admin user
    When I create a page "new-page" under "parent"
    Then the page should be created successfully

  Scenario: Regular user cannot create pages in restricted areas
    Given I am authenticated as a regular user
    And a page "restricted-area" with admin-only access exists
    When I try to create a page under "restricted-area"
    Then the response status should be 404
