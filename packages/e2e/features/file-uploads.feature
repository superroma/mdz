Feature: File Uploads and Attachments
  As a user
  I want to attach files to pages
  So that I can store related documents

  Scenario: Upload and manage file attachments
    Given I am viewing a page
    When I upload a file via the upload button
    Then the file should appear in the attachments list
    And the file should be stored in the page directory

  Scenario: Delete attached file
    Given a page with an attached file
    When I click the delete button for that file
    Then the file should be removed from the list
    And the file should be deleted from disk

  Scenario: Reference file in markdown
    Given a page with an attached image
    When I reference the image with ![pic](./pic.png)
    Then the image should display in the rendered view

