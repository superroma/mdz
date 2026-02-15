---
__schema:
  - name: status
    type: select
    options: [Todo, In Progress, Done]
  - name: priority
    type: select
    options: [Low, Medium, High]
  - name: category
    type: select
    options: [Frontend, Backend]
  - name: due_date
    type: date
---

# Components

MDZ pages support special components you can use directly in your markdown content.

## Progress

A progress bar.

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| value | number (0-100) | yes | | Current progress |
| label | string | no | | Text label above the bar |
| color | "blue" "green" "orange" "red" | no | "blue" | Bar color |
| showPercent | boolean | no | true | Show percentage number |

```
<Progress value={75} label="Sprint progress" color="green" />
```

<Progress value={75} label="Sprint progress" color="green" />

<Progress value={30} label="Budget used" color="orange" />

<Progress value={90} color="red" />

<Progress value={50} showPercent={false} />

## Tabs / Tab

Wrap multiple views or content sections in switchable tabs.

```
<Tabs>
  <Tab name="First">
    Content of the first tab.
  </Tab>
  <Tab name="Second">
    Content of the second tab.
  </Tab>
</Tabs>
```

<Tabs>
  <Tab name="Example A">

This is **tab A** content. You can put any markdown here.

  </Tab>
  <Tab name="Example B">

This is **tab B** content, including components:

<Progress value={60} label="Demo" color="blue" />

  </Tab>
</Tabs>

## View Components

View components display child pages of the current folder in different layouts. They read front-matter fields from child pages to populate the view.

This page has 6 child pages with `status`, `priority`, `category`, and `due_date` fields — the live demos below use them.

All view components support a `filter` prop using MongoDB-style query operators:

| Operator | Meaning |
|----------|---------|
| `$eq` | equals |
| `$ne` | not equals |
| `$in` | in array |
| `$lt` | less than |
| `$gt` | greater than |
| `$lte` | less than or equal |
| `$gte` | greater than or equal |

Date expressions can be used as filter values for date fields:

| Expression | Resolves to |
|------------|-------------|
| `"today"` | current date |
| `"yesterday"` | previous date |
| `"tomorrow"` | next date |

Filter examples:

```
filter={{ status: "Done" }}
filter={{ status: { $ne: "Done" } }}
filter={{ priority: { $in: ["High", "Medium"] } }}
filter={{ due_date: { $lte: "today" } }}
filter={{ due_date: { $gte: "tomorrow" } }}
```

### Sorting

All view components accept a `sort` prop. Use any front-matter field name, or `"name"` to sort by page title. Prefix with `-` for descending order.

```
sort="due_date"
sort="-due_date"
sort="name"
sort="-name"
```

### BoardView

A kanban board that groups child pages by a front-matter field.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| groupBy | string | yes | Front-matter field to group cards by |
| filter | object | no | Filter query |
| sort | string | no | Field to sort by (`"name"` for page title, prefix `-` for desc) |

```
<BoardView groupBy="status" sort="priority" />
```

<BoardView groupBy="status" sort="priority" />

### GridView

A table with configurable columns from front-matter fields. When used without `columns`, it automatically shows all fields defined in the page's schema.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| columns | string[] | no | Front-matter fields to show as columns (defaults to all schema fields) |
| filter | object | no | Filter query |
| sort | string | no | Field to sort by (`"name"` for page title, prefix `-` for desc) |

Without parameters — all schema fields are shown automatically:

```
<GridView />
```

<GridView />

With explicit columns and sorting:

```
<GridView columns={["status", "priority"]} sort="due_date" />
```

<GridView columns={["status", "priority"]} sort="due_date" />

### CalendarView

A monthly calendar that places child pages on dates based on a front-matter date field.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| dateField | string | yes | Front-matter date field to position pages on the calendar |
| filter | object | no | Filter query |

```
<CalendarView dateField="due_date" />
```

<CalendarView dateField="due_date" />

### ListView

A simple list showing child page titles. Optionally displays inline field values next to each title.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| fields | string[] | no | Front-matter fields to display inline (defaults to none — just page names) |
| filter | object | no | Filter query |
| sort | string | no | Field to sort by (`"name"` for page title, prefix `-` for desc) |

Without parameters — just page names:

```
<ListView />
```
<ListView />

With filter:

```
<ListView sort="due_date" filter={{ due_date: { $eq: "today" } }}/>
```

<ListView sort="due_date" filter={{ due_date: { $eq: "today" } }}/>


With inline fields:

```
<ListView fields={["status", "priority", "category"]} sort="-due_date" />
```

<ListView fields={["status", "priority", "category"]} sort="-due_date" />

## No Parameters

`GridView` and `ListView` work without any parameters. `GridView` picks up all schema fields as columns automatically, `ListView` shows page names.

<Tabs>
  <Tab name="GridView">
    <GridView />
  </Tab>
  <Tab name="ListView">
    <ListView />
  </Tab>
</Tabs>

## Combining Views with Tabs

A common pattern is wrapping multiple views in tabs to give different perspectives on the same data. Here it is live — filtering to only incomplete items:

<Tabs>
  <Tab name="Board">
    <BoardView groupBy="status" filter={{ status: { $ne: "Done" } }} sort="priority" />
  </Tab>
  <Tab name="Table">
    <GridView filter={{ status: { $ne: "Done" } }} sort="due_date" />
  </Tab>
  <Tab name="Calendar">
    <CalendarView dateField="due_date" filter={{ status: { $ne: "Done" } }} />
  </Tab>
  <Tab name="All">
    <ListView fields={["status", "priority"]} sort="due_date" />
  </Tab>
</Tabs>
