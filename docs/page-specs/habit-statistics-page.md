# Habit Statistics Page Spec

## Source

- Derived from the `行为习惯统计` screenshots provided by the user on 2026-03-21.
- Reached from the homepage `行为习惯` board action `数据统计`.

## Page Goal

Provide a dedicated statistics surface for reviewing habit check-in counts, accumulated points, active habit coverage, and range-based trend summaries.

## Entry Points

- Homepage `行为习惯` board button `数据统计`.
- Future shortcuts related to habit analytics.

## Layout Zones

### 1. Header

- Large blue gradient header strip consistent with the habit-management page.
- Back affordance on the left.
- Title: `行为习惯统计`.
- Subtitle: descriptive copy about check-in data and trend analysis.

### 2. Summary Metrics

- A four-card horizontal strip appears directly below the header.
- Visible cards:
  - `打卡次数`
  - `累计积分`
  - `习惯数量`
  - `平均积分`

Requirements:
- Cards stay visible even when all values are zero.
- Each card uses a white surface with a colored bottom accent.

### 3. Range Switcher

- A compact chip row appears under the summary cards.
- Visible range chips:
  - `本周`
  - `本月`
  - `历史记录`

Requirement:
- Only one range chip is active at a time.

### 4. Empty State

- A large white rounded panel fills the main body when no qualifying check-in records exist.
- Circular icon above the title.
- Empty-state title:
  - `暂无打卡记录`
- Supporting copy invites the user to start checking in habits.
- CTA button:
  - `去打卡`

Requirement:
- The empty state is a normal first-run analytics state, not an error state.

### 5. Populated State

- When records exist, the main body can switch into a list of habit-summary rows.
- Each row may show:
  - habit name
  - check-in count
  - accumulated points in the selected range

Requirement:
- The screenshot only confirms the empty state, but the page should still be capable of rendering a basic populated summary.

## Interaction Notes

- Clicking back returns to the homepage shell with the `行为习惯` tab active.
- Clicking `去打卡` returns to the homepage `行为习惯` board so the user can act immediately.
- Changing the range chip refreshes the statistics locally without leaving the page.

## States Required

- empty stats page
- populated stats page
- active range chip
- inactive range chip
- back navigation

## Known Unknowns

- The detailed trend-chart visualization has not been shown yet.
- The screenshot confirms top-level summaries but not a canonical populated row design.
