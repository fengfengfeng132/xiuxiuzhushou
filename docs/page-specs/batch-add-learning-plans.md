# Batch Add Learning Plans Spec

## Source

- Derived from three `批量添加学习计划` screenshots provided on 2026-03-20.
- The screenshots cover:
  - empty preview state
  - unified settings with custom points enabled
  - unified settings with custom points disabled
  - date-dependent helper text for one-time tasks

## Page Goal

Allow the user to create multiple study plans from a formatted text block, then apply shared defaults before saving them as separate plans.

## Entry

- Entered from the homepage `学习计划` board by clicking `批量添加`.
- This is a dedicated page, not a modal.

## Header

- Back arrow on the left.
- Page title: `批量添加学习计划`.
- Subtitle: `快速添加多个学习任务`.

## Page Layout

- Blue-gradient top shell, matching the rest of the product family.
- One full-width information banner near the top.
- Two-column main workspace:
  - left: input and shared settings
  - right: preview
- Sticky or persistent bottom action bar with `取消` and `保存 N 个计划`.

## Attachment Banner

- Banner title: `关于附件功能`
- Message states batch add does not support attachment upload.
- Guidance says attachments should be added later from the created plan's edit page.

Requirement:
- Batch add must not expose an attachment uploader.
- The product should explicitly explain this limitation.

## Left Column

### 1. 输入学习计划

- Section title: `输入学习计划`
- Includes a blue helper card describing the supported plain-text format.
- Includes an `AI解析` button next to the note:
  - `格式不对也可以试试 AI 解析`
- Includes a large textarea for raw input.

### 2. Supported Input Format

Visible rules from the screenshot:
- first line is the category name
- following lines are tasks
- task line format is `数字 + 标点 + 任务`
- multiple categories can be entered
- blank lines are ignored

Visible example:
- `语文`
- `1. 修改《映雪堂》28-30`
- `2. 预习三单元语文园地`
- `数学`
- `1. 完成练习册第3章`

Requirement:
- Parsing should produce one plan per task line.
- Category headers should apply to all following task lines until the next category header appears.

Known unknown:
- The exact full list of accepted punctuation characters is not fully legible in the screenshot.

### 3. 统一设置（应用到所有计划）

Shared fields shown in the screenshot:
- `起始日期（可选）`
- `重复类型`
- `默认学习时长（分钟）`
- `自定义积分设置`

Requirement:
- These values apply to every parsed task by default.
- Later editing per task may still be allowed in preview or edit flows.

#### 3a. 起始日期

- Optional
- Defaults to today in the screenshot examples.
- Uses the same helper copy style as the single-plan page.

#### 3b. 重复类型

- Visible selected example: `仅当天 (2026-03-20)`
- Helper panel explains that the task will appear only on the chosen day.

Requirement:
- V1 can support one-time tasks first.
- The shared-repeat design must remain compatible with future repeat types.

#### 3c. 默认学习时长（分钟）

- Numeric input
- Visible example value: `25`
- Helper copy says this is the default duration for each plan and can be adjusted later in the timer page.

Requirement:
- This is the fallback duration for every parsed task.

#### 3d. 自定义积分设置

- Yellow-highlighted section
- Supports both toggle-off and toggle-on states

Visible fields when enabled:
- `启用自定义积分`
- `自定义积分数值`
- `需要管理员审定`

Visible example values:
- custom points enabled
- custom points value `10`
- approval required enabled

Helper copy:
- unified settings apply automatically to all tasks
- each task may still be adjusted individually later

Requirement:
- When custom points is off, parsed tasks should use the default system rule.
- When custom points is on, the shared points configuration applies to every parsed task.

## Right Column

### 预览（N 个计划）

- Section title includes dynamic count, e.g. `预览 (0 个计划)`.
- Empty state copy:
  - `输入内容后会在这里显示预览`

Requirement:
- Preview updates after successful parsing.
- Save button count must match the preview count.
- Empty preview should disable or visually de-emphasize save.

Known unknown:
- No screenshot yet shows the non-empty preview layout.

## Footer Actions

- Left button: `取消`
- Right primary button: `保存 N 个计划`

Requirement:
- The count must be data-driven.
- `保存 0 个计划` is shown in the empty state.

## Interaction Notes

- `AI解析` is present but its detailed behavior is not shown yet.
- Batch add should be able to work without AI parsing if the text already matches the required format.
- Date changes should update repeat helper text.

## Validation

Blocking:
- no parsable task lines
- malformed shared settings
- invalid custom points value when custom points is enabled

Non-blocking:
- blank lines in the textarea
- attachment absence

## Known Unknowns

- non-empty preview row structure
- exact AI parsing behavior
- whether users can edit or delete parsed tasks inside preview before save
- exact cancel destination
