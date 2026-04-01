# Add Wish Modal Spec

## Source

- Derived from the `添加我的愿望` modal screenshots provided on 2026-03-20.
- The screenshots cover:
  - main add-wish modal content
  - icon-category switching across multiple tabs
  - custom image upload area
  - all four redemption modes
  - mode-specific configuration for `多次兑换`, `循环愿望`, and `永久愿望`

## Entry

- Opened from `我的积分和成就` by clicking:
  - `添加愿望`
  - `添加第一个愿望`
- The same modal shell is reused for editing an existing wish.
- This is a floating modal, not a dedicated page.

## Modal Goal

Let the user define a redeemable wish item with:

- visual icon
- optional custom image
- title and description
- category
- star cost
- redemption behavior

## Header

- Title: `添加我的愿望`
- Subtitle explains that the user is setting a reward to work toward.
- Close icon on the top right.

Requirement:
- Closing the modal should discard unsaved changes unless the future product specifies draft persistence.

## Section 1: 选择图标

- Large preview card at the top showing the currently selected icon.
- Prompt text tells the user to choose a favorite icon below.

### Icon Category Tabs

Visible category tabs:
- `玩具游戏`
- `美食零食`
- `活动娱乐`
- `电子产品`
- `书籍学习`
- `特权奖励`
- `其他`

Requirement:
- Switching the category changes the icon grid below.
- The selected category uses a stronger outline/fill state.

### Icon Grid

- Each category exposes a grid of emoji-style icons.
- One icon can be selected at a time.

Visible examples by category:
- `玩具游戏`: teddy bear, gamepad, dice, target, palette
- `美食零食`: pizza, burger, fries, ice cream, cake, donut
- `活动娱乐`: clapperboard, tent, amusement-ride icons, ball, bicycle, music, guitar, piano
- `电子产品`: phone, laptop, gamepad, camera, headphones, watch, monitor, TV, piano-like/other devices
- `书籍学习`: books, notebook, document, pencil
- `特权奖励`: crown, star, trophy, gift, diamond, medals
- `其他`: balloon, rainbow, unicorn, dog, cat, dinosaur, rocket, moon, sun, flowers

Requirement:
- If no custom image is uploaded, the selected icon becomes the wish-card visual.

## Section 2: 自定义图片（可选）

- Upload entry labeled roughly:
  - `选择图片（≤5MB）`
- Helper copy explains that the uploaded image will display on the wish card and will override the emoji icon.

Requirement:
- Custom image is optional.
- If uploaded successfully, it takes precedence over the selected icon for display.

## Section 3: 文本字段

### 愿望名称

- Required
- Single-line input

### 愿望描述

- Optional
- Multiline textarea
- Character counter visible in the screenshot:
  - `0/200`

### 分类

- Required-looking field in the visible layout, implemented as a select/dropdown
- Visible selected example:
  - `玩具`

Known unknown:
- The full dropdown option list is not shown.

### 需要多少星星？

- Required
- Numeric input
- Visible example:
  - `10`

## Section 4: 参考指南

- Yellow helper panel below cost input
- Visible guidance tiers:
  - small wishes: `5-20 星`
  - medium wishes: `20-50 星`
  - large wishes: `50-200 星`
  - super wishes: `200+ 星`

Requirement:
- This panel is advisory only, not a validator by itself.

## Section 5: 重复兑换设置

- Four mutually exclusive mode cards:
  - `单次兑换`
  - `多次兑换`
  - `循环愿望`
  - `永久愿望`

Requirement:
- Exactly one mode is active.
- The selected mode changes the configuration panel below.

### 5a. 单次兑换

- Description:
  - `兑换后消失`

Behavior:
- The wish can be redeemed once and is then removed or hidden from available redemption.

### 5b. 多次兑换

- Description:
  - `设定兑换次数`
- Shows a `最大兑换次数` numeric input.
- Visible example:
  - `5`
- Helper copy:
  - `可兑换 5 次`
- Mode note says each redemption reduces remaining count until depleted.

Behavior:
- The wish can be redeemed a fixed number of total times.

### 5c. 循环愿望

- Description:
  - `按期重置次数`
- Shows `重置周期` options:
  - `每日重置`
  - `每周重置`
  - `每月重置`
- Shows `每个周期可兑换次数` numeric input.
- Visible example:
  - `1`
- Mode note says counts reset automatically by period and can be used long-term.

Behavior:
- The wish has a per-period redemption allowance that resets automatically.

### 5d. 永久愿望

- Description:
  - `无限次兑换`
- Mode note says it is suitable for common rewards.

Behavior:
- The wish can be redeemed without a count limit.

## Footer Actions

- Left secondary button: `取消`
- Right primary button: `添加愿望`

Requirement:
- The primary button should stay enabled only when required fields are valid.

## Edit Variant

- Editing an existing wish opens the same modal structure.
- Existing values should be prefilled:
  - selected icon or custom image
  - name
  - description
  - category
  - cost
  - redemption mode and mode-specific config

Requirement:
- Edit should preserve the original wish identity rather than create a duplicate.

## Success Feedback

- After successful creation, the page shows a bottom-right toast.
- Visible success copy pattern:
  - `愿望添加成功！`
  - `需要 X 星 才能兑换这个愿望`

Requirement:
- Creation success feedback should be immediate and non-blocking.

## Validation

Blocking:
- missing wish name
- missing star cost
- non-positive star cost
- invalid mode-specific numeric input

Non-blocking:
- no custom image
- empty description

## Interaction Notes

- Category tabs under icon selection are different from the later `分类` dropdown field; one controls visual icon browsing, the other controls the reward's semantic category.
- Uploading a custom image affects the card appearance, not the redemption logic.

## Known Unknowns

- full category dropdown option list for `分类`
- whether closing the modal prompts on unsaved changes
