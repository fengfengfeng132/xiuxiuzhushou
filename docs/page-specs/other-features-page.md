# Other Features Page Spec

## Source

- Derived from the `其他功能` screenshot provided by the user on 2026-03-21.

## Page Goal

Provide a grouped navigation hub for the homepage `其他` summary entry so users can browse secondary modules, search across feature names, and jump into already implemented product areas.

## Layout Zones

### 1. Header

- Dark blue-gray hero bar with back navigation.
- Page title: `其他功能`.
- Subtitle: `更多工具和管理功能`.

### 2. Customer-Service Card

- Large white rounded card directly below the hero.
- Left side shows `微信客服` title and two lines of helper copy.
- Right side shows a QR-style visual block.

Requirement:
- This is informational only in the current slice and does not need a live QR payload yet.

### 3. Search Bar

- Full-width rounded search field under the customer-service card.
- Placeholder text follows the screenshot pattern:
  - `搜索功能（例如：宠物、习惯、备份…）`

Requirement:
- Search filters the visible cards locally without leaving the page.

### 4. Feature Groups

- Feature cards are grouped into labeled sections.
- The screenshot confirms these groups:
  - `会员功能`
  - `通用功能`
  - `系统功能`
  - `学校与机构`
  - `其他功能`
- Membership section has a larger highlighted `会员管理` card and a secondary `兑换码` card.
- Other sections use compact white cards with colored icon chips.
- Some cards include a small `新功能` badge.

## Confirmed Card Labels

### Membership

- `会员管理`
- `兑换码`

### General

- `行为习惯`
- `我的阅读`
- `337晨读`
- `听写背诵`
- `专注计时器`
- `电子宠物`
- `计划精选`
- `成绩追踪`
- `成绩分析`
- `任务打印`
- `待办事项`

### System

- `儿童模式设置`
- `账号密码修改`
- `用户管理`
- `仪表盘配置`
- `系统设置`
- `数据导出`
- `数据导入`
- `使用帮助`

### School / Institution

- `班级管理（老师）`
- `我的班级（学生）`

### Other

- `身高管理`
- `存钱罐`
- `兴趣班记录`

## App Information Card

- Near the bottom of the page there is a dedicated `应用信息` card.
- It shows label/value rows for:
  - version
  - commit
  - build time
  - last update
  - environment

Requirement:
- Values can be static in the current local-first slice as long as the layout matches the screenshot.

## Footer Note Card

- Final white rounded card titled `关于其他功能`.
- Contains one paragraph explaining that some modules are still being updated and users can contact the team with requests.

## Interaction Notes

- Clicking `行为习惯` can resolve to the dedicated habit-management page.
- Clicking `仪表盘配置` resolves to the dedicated page documented in `docs/page-specs/dashboard-config-page.md`.
- Clicking `身高管理` resolves to the dedicated height-management module documented in `docs/page-specs/height-management-pages.md`.
- Clicking `电子宠物` resolves to the dedicated pet center documented in:
  - `docs/page-specs/pet-adoption-page.md`
  - `docs/page-specs/pet-interaction-page.md`
- Clicking `使用帮助` resolves to the dedicated help center documented in `docs/page-specs/usage-help-page.md`.
- Unimplemented cards should still be clickable and show a lightweight placeholder notice instead of doing nothing.
- Searching should hide entire empty sections when none of their cards match.

## Visual Direction

- Dark header, light body, long single-column page rhythm.
- Section cards should stay bright and rounded, with soft shadows and colored icon chips.
- The membership highlight card should read as a warmer premium tile.

## States Required

- default full list
- filtered list after search
- zero-result search state
- highlighted membership card
- `新功能` badge state
- app-info card
- footer note card
