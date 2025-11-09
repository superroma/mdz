Feature: Markdown Formatting Rendering
  As a user
  I want to see markdown content rendered with proper formatting
  So that I can read formatted content in view mode

  Scenario: Headers are rendered as HTML headings
    Given I am viewing the "Markdown Guide" page
    Then I should see an H1 heading with text "Markdown Guide"
    And I should see an H2 heading with text "Headers"
    And I should see an H2 heading with text "Text Formatting"

  Scenario: Bold text is rendered with strong styling
    Given I am viewing the "Markdown Guide" page
    Then I should see bold text "Bold text"

  Scenario: Italic text is rendered with emphasis styling
    Given I am viewing the "Markdown Guide" page
    Then I should see italic text "Italic text"

  Scenario: Inline code is rendered in a code element
    Given I am viewing the "Markdown Guide" page
    Then I should see inline code "Inline code"

  Scenario: Unordered lists are rendered as HTML lists
    Given I am viewing the "Markdown Guide" page
    Then I should see a list item "Item 1"
    And I should see a list item "Item 2"
    And I should see a list item "Item 3"

  Scenario: Ordered lists are rendered as numbered lists
    Given I am viewing the "Markdown Guide" page
    Then I should see a numbered list item "First item"
    And I should see a numbered list item "Second item"
    And I should see a numbered list item "Third item"

  Scenario: Links are rendered as clickable anchor elements
    Given I am viewing the "Markdown Guide" page
    Then I should see a link with text "Link text" and href "https://example.com"

  Scenario: Code blocks are rendered with proper formatting
    Given I am viewing the "Markdown Guide" page
    Then I should see a code block containing "function hello()"

  Scenario: Blockquotes are rendered as quote elements
    Given I am viewing the "Markdown Guide" page
    Then I should see a blockquote containing "This is a blockquote"

  Scenario: Tables are rendered as HTML table elements
    Given I am viewing the "Markdown Guide" page
    Then I should see a table element
    And the table should have header cells with "Column 1", "Column 2", and "Column 3"
    And the table should have data cells with "Data 1", "Data 2", and "Data 3"

