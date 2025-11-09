Feature: Custom Fields
  As a user
  I want to add custom fields to my pages
  So that I can store structured data

  Scenario: Define schema in parent page
    Given I am viewing a page
    When I create a parent page with a schema
    And I create a child page
    Then the child should have fields matching the schema

  Scenario: Edit custom field values
    Given a page with custom fields
    When I edit a field value in the collapsible panel
    Then the value should auto-save
    And the front-matter should be updated

  Scenario: Select field validation
    Given a page with a select field
    When I edit the field
    Then I should only see the defined options

