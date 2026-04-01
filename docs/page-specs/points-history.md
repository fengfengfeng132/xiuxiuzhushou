# Points History Spec

## Source

- Derived from three `积分历史` screenshots provided on 2026-03-20.
- The screenshots cover:
  - empty state
  - populated state with `获得` selected
  - populated state with `全部记录` selected

## Entry

- Entered from `我的积分和成就` by clicking `积分历史`.
- This is a dedicated page, not a modal.

## Page Goal

Let the active profile review star earning and spending records over a selected time range, understand summary statistics, and browse detailed transaction history grouped by date.

## Header

- Blue-to-purple gradient hero area.
- Back button on the left.
- Title: `积分历史`
- Subtitle describing that the page shows star earning and spending records.

## Section 1: 统计时段

- Large white filter panel below the header.
- Title: `统计时段`
- Range chips visible in the screenshots:
  - `全部`
  - `近7天`
  - `近30天`
  - `近90天`
  - `自定义`
- Active chip is visually filled dark.
- A line below shows the resolved date range, for example:
  - `当前统计范围：2026-02-18 至 2026-03-19`

Requirement:
- Selecting a range updates both the summary cards and the record list.
- `自定义` implies a custom date-picker flow, but that flow is not yet shown.

## Section 2: Summary Cards

- Four colored summary cards in one row:
  - `时段获得`
  - `时段消费`
  - `净变化`
  - `记录条数`

Visible values in screenshots:
- empty state:
  - `+0 星`
  - `-0 星`
  - `+0 星`
  - `0`
- populated state:
  - `+12 星`
  - `-0 星`
  - `+12 星`
  - `4`

Requirement:
- Summary values must be derived from the filtered transaction set currently in scope.

## Section 3: Record-Type Tabs

- Horizontal tab bar with:
  - `全部记录`
  - `获得`
  - `消费`
- The active tab uses a filled gradient style.

Requirement:
- Tabs filter the currently selected range, not the whole dataset.
- Empty-state content should update according to the active tab.

## Section 4: Record List

### Empty State

- Large white content panel.
- Scroll/receipt icon in the center.
- Title:
  - `暂无记录`
- Supporting copy indicates that reward redemption and spending records will appear here.

Requirement:
- Empty state is valid and not treated as an error.

### Populated State

- Records are grouped by date.
- Each date group has:
  - a left date icon
  - a date title, e.g. `2026年3月18日`
  - a summary pill on the right, e.g. `+12 星`

### Record Row Structure

Visible fields from the screenshots:
- task title, e.g. `磨耳朵（审定通过）`
- time, e.g. `22:23`
- category, e.g. `英语` or `技能`
- optional status badge, e.g. `已审定`
- amount on the far right, e.g. `+1 星`

Visual rule:
- gain rows use green accents and green amount text.

Requirement:
- The row shape should support both gain and spend entries.
- `消费` rows are not shown yet, but the data model and UI must stay open for them.

## Section 5: 温馨提示

- Light-blue tips panel below the records.
- Title:
  - `温馨提示`
- Visible points:
  - points history shows up to the latest 100 records
  - green means earned stars, purple means consumed stars
  - all records are permanently stored in the database

Requirement:
- This panel is informational and should render in both empty and populated states.

## Interaction Notes

- `返回` goes back to the points center.
- Range chips and record-type tabs can be combined.
- Date grouping appears to be descending by day in the screenshots.

## States Required

- empty history
- filtered non-empty history
- gain-only tab
- all-records tab
- spend-only tab
- range-filtered summaries

## Validation

Blocking:
- summary totals inconsistent with filtered visible rows
- record count inconsistent with filtered visible rows

Non-blocking:
- empty filtered result

## Known Unknowns

- `消费` tab populated-state visuals
- `自定义` date-range picker flow
- whether row click opens a detail page
- exact pagination or lazy-loading behavior beyond the visible latest 100 rule
