---
__schema:
  - name: status
    type: select
    options: [Planning, Active, On Hold, Completed]
  - name: owner
    type: text
  - name: budget
    type: number
  - name: start_date
    type: date
---

# Projects

Project tracking workspace with custom fields for project management.

<GridView
columns={["status", "owner", "budget", "start_date"]}
filter={{ status: { $in: ["Planning", "Active"] } }}
sort="start_date"
/>

