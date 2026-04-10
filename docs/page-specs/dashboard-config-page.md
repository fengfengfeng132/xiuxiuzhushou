# Dashboard Config Page

## Source

- Derived from the `仪表盘配置` screenshots provided by the user on 2026-04-10.

## Page Goal

Provide a dedicated configuration page for the homepage top module strip so users can decide which modules are shown, reorder them, and choose whether the homepage uses plan-only mode or tab mode.

## Entry

- User enters `其他功能`.
- User clicks the `仪表盘配置` card in the `系统功能` group.

## Layout Zones

### 1. Header

- Blue-violet gradient header with back navigation.
- Title: `仪表盘配置`.
- Subtitle describes homepage module customization.

### 2. Summary Card

- White rounded card under the header.
- Copy explains:
  - choose which modules appear at the top of the homepage
  - drag rows to change the display order
  - the `其他` button always stays at the end
- Shows current visible-count summary in the pattern `当前显示: X/23`.

### 3. Homepage Display Mode

- White rounded section titled `主页展示方式`.
- Two mutually exclusive options:
  - `仅学习计划`
  - `Tab 形式`

Requirements:
- `仅学习计划` hides the homepage tab bar and always shows the plan board.
- `Tab 形式` keeps the existing `学习计划 / 行为习惯` tab shell.

### 4. Module List

- Long vertical list of white rounded rows.
- Each row includes:
  - six-dot drag handle at the start
  - icon chip
  - module title
  - status text
  - right-side show/hide switch

Status rules:
- Visible rows show `显示中 · 排序 N`.
- Hidden rows show `已隐藏`.

Behavior:
- Dragging reorders the module list.
- Toggling the switch updates visible vs hidden state in the draft configuration.
- The list excludes the fixed `其他` entry because that card is always appended after the selected modules on the homepage.

## Confirmed Module Catalog

- `剩余时长`
- `学习时间`
- `运动户外时间`
- `任务数量`
- `星星数`
- `完成率`
- `图表统计`
- `积分成就`
- `行为习惯`
- `成绩跟踪`
- `成绩分析`
- `337晨读`
- `我的阅读`
- `身高管理`
- `兴趣班记录`
- `待办事项`
- `听写背诵`
- `专注计时器`
- `存钱罐`
- `电子宠物`
- `计划精选`
- `任务打印`
- `使用帮助`

## Footer Actions

- `恢复默认`
- `保存配置`

Requirements:
- Changes do not apply to the homepage until the user clicks `保存配置`.
- `恢复默认` resets both display mode and module visibility/order to the captured default state.

## Homepage Sync Rules

- After save, the homepage top module strip must:
  - hide modules that are disabled
  - show enabled modules in the saved order
  - keep `其他` fixed at the end
- The configuration is locally persisted and should survive refresh/reopen.

## Default State Captured From Screenshot

- Display mode defaults to `Tab 形式`.
- The captured default visible modules are:
  - `学习时间`
  - `运动户外时间`
  - `任务数量`
  - `完成率`
  - `积分成就`
  - `行为习惯`
  - `电子宠物`
  - `使用帮助`

## States Required

- default saved state
- unsaved draft state
- row drag reorder state
- hidden row state
- visible row state
- plan-only display mode selected
- tab display mode selected
