---
__schema:
  - name: status
    type: select
    options: [Todo, In Progress, Done]
  - name: priority
    type: select
    options: [Low, Medium, High]
  - name: due_date
    type: date
---

# Tasks

This is a task management workspace demonstrating custom fields and view components.

## Custom Fields

This page uses a custom schema defined in the front-matter (`__schema` field) to define structured fields for all child tasks:

- **status**: A select field with options: Todo, In Progress, Done
- **priority**: A select field with options: Low, Medium, High  
- **due_date**: A date field for tracking deadlines

All child pages created under this Tasks folder will inherit these custom fields and display them in a collapsible panel. You can edit field values directly in the panel, and they will be automatically saved to the page's front-matter.

## Task Views

The page provides multiple views for managing tasks:

<Tabs>
  <Tab name="Board">
    <BoardView 
      groupBy="status" 
      filter={{ status: { $ne: "Done" } }} 
      sort="priority" 
    />
  </Tab>
  
  <Tab name="Active">
    <GridView 
      columns={["status", "priority", "due_date"]}
      filter={{ status: { $ne: "Done" } }}
      sort="due_date"
    />
  </Tab>
  
  <Tab name="Calendar">
    <CalendarView dateField="due_date" />
  </Tab>
  
  <Tab name="All">
    <ListView fields={["status", "priority"]} sort="due_date" />
  </Tab>
</Tabs>

## Adding Tasks

To add a new task:

1. Create a child page under this Tasks folder
2. The page will automatically inherit the custom fields (status, priority, due_date)
3. Fill in the task details in the markdown content
4. Set the custom field values using the collapsible panel on the right
5. The task will appear in all the configured views above based on its field values

