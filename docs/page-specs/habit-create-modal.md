# Habit Create Modal Spec

## Source

- Derived from the `新建习惯` modal screenshots provided by the user on 2026-03-21.
- Opened from the dedicated habit-management page.

## Modal Goal

Allow the user to create one behavior habit with rule settings, reward points, icon, and color before it appears in the local habit list.

## Modal Layout

### 1. Header

- Title: `新建习惯`.
- Subtitle describes creating and configuring one habit plus rule and point settings.
- Close icon button at the top right.

### 2. Basic Fields

- `习惯名称`
  - placeholder example similar to `例如：早起、运动`
- `描述`
  - multiline text area
  - placeholder describes the habit detail

### 3. Habit Type

- Field label: `习惯类型`
- Closed state shows one selected option.
- Open dropdown state lists:
  - `每日一次`
  - `每日多次`
  - `每周多次`
- Selected option shows a trailing checkmark.
- Helper copy appears below the field for the currently selected rule, for example:
  - `每天只能打卡一次`

Requirement:
- The modal must support at least these three frequency presets even if later variants are added.

### 4. Points Settings

- Numeric input under `积分设置`.
- Copy explains:
  - positive number = reward points
  - negative number = deduct points
  - accepted range: `-100` to `100`
- Checkbox option:
  - `需要家长审定后才发积分`
- Helper copy explains that enabled approval records the check-in as pending until a parent approves or adjusts it.

### 5. Visual Picker

- Two side-by-side selector panels:
  - `图标`
  - `颜色`
- Icon grid is scrollable and shows many selectable options.
- Color grid is scrollable and shows multiple pastel/accent swatches.
- One icon and one color remain visibly selected.

### 6. Preview

- Compact preview card near the footer.
- Shows the chosen icon and habit name placeholder/state.

### 7. Footer Actions

- Primary action: `创建`
- Secondary action: `取消`

Requirements:
- `创建` should stay blocked until required fields are valid.
- `取消` and top-right close should dismiss without saving.

## Validation Rules

- Habit name is required.
- Habit description is optional.
- Habit type is required and must be one of the three visible options.
- Points value must be an integer between `-100` and `100`.
- One icon must be selected.
- One color must be selected.

## States Required

- modal closed
- modal open
- dropdown closed
- dropdown open
- create enabled
- create disabled

## Known Unknowns

- The exact pending-review status UI after parent approval is enabled has not been shown yet.
- Editing reuse of the same modal has not been shown yet.
