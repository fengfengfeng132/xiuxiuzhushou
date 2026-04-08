# Add Learning Plan Spec

## Source

- Derived from two `添加学习计划` screenshots provided on 2026-03-20.
- Both screenshots show the same page with different `时间设置` modes selected.

## Page Goal

Allow the active profile to create a study plan with structured scheduling, optional description, optional scoring override, and optional attachments.

## Entry

- Entered from the homepage `学习计划` board by clicking `添加计划`.
- This is a dedicated page, not a modal layered on top of the homepage.

## Header

- Back arrow on the left.
- Page title: `添加学习计划`.
- A compact breadcrumb/date line below the title, showing the current date and context label.

## Form Structure

### 1. 起始日期

- Type: date input
- Label shows `(可选)`
- Default visible value in the screenshot: `2026-03-20`
- Helper text explains:
  - default is today
  - one-time tasks appear on the specified day
  - repeat tasks generate from the chosen start date

Requirement:
- V1 can default this field to today even if a richer scheduler arrives later.

### 2. 类别标签

- Type: dropdown/select
- Required
- Placeholder text: `请选择类别`

Known unknown:
- Available category options are not visible yet.

### 3. 计划名称

- Type: single-line text input
- Required
- Example placeholder:
  - `如：每天背10个英语单词`
- Length limit:
  - `1-100 字`
- Live counter is shown on the right.

### 4. 计划内容

- Type: multiline textarea
- Optional
- Example placeholder:
  - `如：利用晨读时间，结合课本 Unit1 单词表`
- Length limit:
  - `0-1000 字`
- Live counter is shown on the right.

### 5. 重复类型

- Type: select
- Required
- Visible selected example:
  - `仅当天 (2026-03-20)`
- Helper panel below explains where the task will appear.

Requirement:
- V1 should at minimum support one-time plans.
- Data design should stay open for future repeat types.

### 6. 时间设置

- Optional section
- Two-segment switch:
  - `时间段`
  - `时长`

#### 6a. 时长模式

- Shows a green-highlighted configuration panel.
- Includes preset chips:
  - 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 90, 120, 150, 180 分钟
- Includes a custom duration input row.
- Screenshot example selects `25分钟`.

#### 6b. 时间段模式

- Shows a blue-highlighted configuration panel.
- Includes:
  - `开始时间`
  - `结束时间`
- Screenshot example:
  - `19:00`
  - `20:30`
- Helper copy explains the resulting fixed time window.

Requirement:
- Only one mode can be active at a time.

### 7. 积分设置

- Optional section
- Contains a toggle:
  - `启用自定义积分`
- Enabled state includes:
  - `积分数值` numeric input (`1-1000`)
  - reward preview card (`奖励：X⭐`)
  - `需要审定` switch
  - when `需要审定` is on, show a short workflow guide:
    - completion creates a pending review task
    - reviewer can approve, adjust, or reject points
    - stars are credited only after review
- Toggle-off state shows a system-rule summary card.

Visible rule copy:
- base reward `1星`
- duration bonus examples
- morning bonus multiplier
- weekend bonus multiplier

Requirement:
- V1 may keep custom points off by default and display the system rule first.

### 8. 附件

- Optional section
- Drag-and-drop upload area
- Supports images, audio, video, PDF
- Copy suggests:
  - maximum 3 files
  - single file max 50MB

Requirement:
- Early V1 may render this section as placeholder-only if file persistence is deferred.

## Footer Actions

- Left button: `取消`
- Right button: `保存计划`

Requirement:
- `保存计划` should be the primary action and stay visible at the bottom of the page.

## Visual Direction

- Same blue-gradient top shell as the homepage.
- Long white form card centered on the page.
- Section blocks use soft colored accents:
  - purple for date/content labels
  - blue for time
  - yellow for points
  - gray for attachments

## Validation

Blocking:
- missing category
- missing title
- missing repeat type
- invalid time configuration for the chosen mode

Non-blocking:
- empty content
- no attachments
- default start date

## Known Unknowns

- Category option list
- Repeat-type option list beyond `仅当天`
- Custom-points UI after toggle-on
- What happens after `取消`
- Whether save returns to homepage or a plan-detail page
