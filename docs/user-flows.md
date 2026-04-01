# User Flows

## Reference Intake Status

- The homepage flow below is derived from the first screenshot provided on 2026-03-20.
- Items marked as assumptions should stay provisional until more screenshots arrive.

## Flow 1: Open Homepage

1. User opens `绣绣助手`.
2. User lands on a blue-gradient dashboard header.
3. User sees:
   - product name at top left as `绣绣助手`
   - a short streak/progress sentence under the title
   - a profile switcher at top right
   - a horizontal row of summary cards
   - two main tabs: `学习计划` and `行为习惯`
   - a large content board under the active tab

Acceptance notes:
- `学习计划` is the default active tab in the reference screenshot.
- Empty-state content is valid and should not be treated as an error.

## Flow 2: Switch Active Profile

1. User clicks the top-right profile control.
2. User sees available local profiles.
3. User chooses another profile.
4. Dashboard content refreshes to that profile's plans, habits, rewards, and summary metrics.

Acceptance notes:
- This is a local profile switch, not cloud sync.
- The control currently uses an avatar + name pattern in the reference screenshot.

## Flow 3: Browse by Week and Day

1. User stays in the `学习计划` tab.
2. User uses left/right navigation or the date strip to change the selected day.
3. The plan list refreshes for the chosen date.
4. If plans exist for that day, completed or active cards appear in the board.
5. If no plan exists for that day, the empty state appears.

Acceptance notes:
- The board shows one week at a time.
- `今天` is a first-class shortcut.
- A calendar icon exists in the board controls.
- The same board must support both current-day active cards and historical completed cards.

## Flow 3A: Act On Today's Study Plan Card

1. User opens the `瀛︿範璁″垝` board on today's date.
2. User sees one or more active plan cards in the `鎴戠殑璁″垝` list.
3. Each active card exposes two direct actions:
   - `蹇€熷畬鎴?`
   - `寮€濮嬭鏃?`
4. User can finish the plan directly from the card, or start a timing flow from the same card.

Acceptance notes:
- These are board-level actions, not hidden inside the detail modal.
- The screenshot confirms the existence and placement of both actions, but their downstream result screens are still unknown.

## Flow 3B: Quick Complete A Today's Plan

1. User opens the `学习计划` board on today's date.
2. User clicks `快速完成` on an active plan card.
3. A `快速完成任务` modal opens.
4. User reviews the plan summary.
5. User stays on `输入时长` or switches to `实际时间`.
6. User records duration.
7. User optionally adds note text and note attachments.
8. User confirms with `确认完成`.
9. The plan should move from the active board state into a completed state.

Acceptance notes:
- This is a modal flow.
- The screenshots confirm `输入时长` mode, preset duration chips, note field, and note attachments.
- The exact internals of `实际时间` still require more screenshots.

## Flow 3C: Start A Timed Study Session

1. User opens the `学习计划` board on today's date.
2. User clicks `开始计时` on an active plan card.
3. The app opens a dedicated timer page.
4. User sees the current plan context, timer mode switcher, timer display, sound control, and `开始学习` button.
5. User chooses one timer strategy:
   - `正计时`
   - `倒计时`
   - `番茄`
6. User starts the session from the timer page.

Acceptance notes:
- This is a full page, not a modal.
- `倒计时` shows a target-duration chip and `切换默认时长`.
- `番茄` shows work-session metadata and a 25-minute default.
- A collapsed `学习录音 (0)` entry exists at the bottom of the page.

## Flow 3D: Open Plan Management

1. User opens the `学习计划` board.
2. User clicks `管理` on the right side of `我的计划`.
3. The app opens a dedicated `计划管理` page.
4. User sees date navigation, `保存`, `取消`, a selection bar, an instructions panel, and a sortable list of plan cards.

Acceptance notes:
- This is a full page, not a modal.
- The management page is date-scoped and supports drag sorting plus multi-select.

## Flow 3E: Copy Selected Plans To Another Date

1. User enters `计划管理`.
2. User selects one or more plans.
3. The top action bar shows `复制到...`, `分享计划`, and `删除选中`.
4. User clicks `复制到...`.
5. A `复制到指定日期` modal opens.
6. User chooses a target date from the calendar picker.
7. User confirms with `确认复制`.

Acceptance notes:
- The modal explicitly references the source date and selected-count context.
- The screenshot confirms calendar-based date selection.

## Flow 3F: Delete Selected Plans

1. User enters `计划管理`.
2. User selects one or more plans.
3. User clicks `删除选中`.
4. A `删除任务` modal opens.
5. User chooses one delete scope:
   - `仅删除 今天`
   - `删除所有重复任务（所有日期）`
6. User confirms the intended destructive path, or cancels.

Acceptance notes:
- The delete modal is specifically aware of recurring tasks.
- Deleting all occurrences is irreversible and must be presented as the more dangerous option.

## Flow 4: Inspect An Existing Plan

1. User browses to a day that has one or more study plans.
2. User sees populated plan cards in the `我的计划` list.
3. User clicks one plan card.
4. A detail modal opens.
5. User can inspect:
   - plan content
   - repeat type
   - active date range
   - point reward
   - created time
   - completion records
   - attachments
6. User can choose `编辑计划` or `删除重复任务`.

Acceptance notes:
- This is a modal detail view, not an immediate page navigation.
- The modal supports completed plans with multiple session records.

## Flow 5: Start Plan Creation from Homepage

1. User opens the `学习计划` tab.
2. User clicks one of the top-right actions in the board header.
3. User enters a dedicated `添加学习计划` page.

Known actions from the screenshot:
- `AI创建`
- `批量添加`
- `添加计划`

Acceptance notes:
- All three entry paths now have reference screenshots and should be treated as real product flows.

## Flow 6: Create a Study Plan

1. User enters the `添加学习计划` page from the homepage.
2. User sees a back button, title, current date context, and a long-form creation form.
3. User fills in:
   - 起始日期
   - 类别标签
   - 计划名称
   - 计划内容
   - 重复类型
   - 时间设置
   - 积分设置
   - 附件
4. User chooses one of two time-setting modes:
   - `时间段`
   - `时长`
5. User taps `保存计划`.
6. If required fields are valid, the plan is created and should return to a plan-visible state.

Acceptance notes:
- `类别标签`、`计划名称`、`重复类型` are visibly required.
- `起始日期`、`计划内容`、`时间设置`、`积分设置`、`附件` are shown as optional.
- The form is a full page, not a small modal.

## Flow 7: Start AI Plan Creation

1. User enters the `学习计划` homepage.
2. User clicks `AI添加` or `AI创建`.
3. User enters the dedicated `AI 智能创建` page.
4. User sees:
   - a conversation-history sidebar
   - an empty-state assistant panel
   - suggested prompt chips
   - upload-image entry
   - a bottom composer

Acceptance notes:
- This is a full-page workspace.
- The page explicitly frames AI as being in a trial/experience period.

## Flow 8: Ask AI to Create Plans

1. User types a natural-language request, or uploads an image.
2. User sends the request.
3. AI interprets the input and generates structured learning-plan suggestions.
4. Those suggestions are turned into homepage study plans.

Acceptance notes:
- The user explicitly wants AI output to become homepage learning plans.
- The exact confirmation UI is still unknown.

## Flow 9: Manage AI Sessions

1. User opens the AI page.
2. User sees `会话历史`.
3. User can start `新会话`.
4. User can clear the active draft through `清空`.

Acceptance notes:
- Session history is local product memory, not a cloud chat archive requirement.

## Flow 10: Start Batch Plan Creation

1. User enters the `学习计划` homepage.
2. User clicks `批量添加`.
3. User enters the dedicated `批量添加学习计划` page.
4. User sees:
   - input-format instructions
   - raw text textarea
   - shared settings for all generated plans
   - preview column
   - bottom save bar

Acceptance notes:
- Batch add is a full page.
- The page explicitly states that attachments are not supported in this flow.

## Flow 11: Parse Batch Input

1. User types formatted plan text into the textarea.
2. The system parses categories and task lines.
3. The preview count updates.
4. The preview column shows the generated plans.

Acceptance notes:
- One category can contain multiple tasks.
- Blank lines should be ignored.
- If the format is imperfect, `AI解析` is available as an assistive path.

## Flow 12: Apply Shared Defaults in Batch Add

1. User sets a shared start date.
2. User sets a shared repeat type.
3. User sets a shared default duration.
4. User optionally enables shared custom points.
5. These values apply to all parsed tasks.

Acceptance notes:
- Shared values are defaults for every generated plan.
- Custom points can be toggled on or off.

## Flow 13: Configure Plan Duration

1. User enters `时间设置`.
2. User switches to the `时长` segment.
3. User sees preset minute chips and a custom duration input.
4. User picks one preset or types a custom minute value.

Acceptance notes:
- The screenshot shows presets from `5分钟` through `180分钟`.
- `25分钟` is selected in the reference image.

## Flow 14: Configure Plan Time Range

1. User enters `时间设置`.
2. User switches to the `时间段` segment.
3. User sets a start time and end time.
4. The page shows a helper sentence describing the resulting fixed window.

Acceptance notes:
- The reference example uses `19:00` to `20:30`.

## Flow 15: Review System Points

1. User scrolls to `积分设置`.
2. User sees a toggle for `启用自定义积分`.
3. If the toggle is off, the page displays system scoring guidance.
4. User can use that guidance to estimate the reward before saving.

Acceptance notes:
- The reference screenshot only shows the toggle-off state.
- Custom-points input is not yet visible and should remain unspecified until a later screenshot confirms it.

## Flow 16: Switch to Habit Board

1. User clicks the `行为习惯` tab.
2. The main board changes from plan-centric content to habit-centric content.
3. Summary cards remain visible at the top of the homepage.
4. If no habits exist yet, the board shows a dedicated empty state with `创建习惯`.
5. If habits already exist, the board shows:
   - `我的行为习惯` section header
   - week/day browsing strip
   - search and filter controls
   - one or more habit cards with `打卡` action

Acceptance notes:
- The board now has both empty and populated reference states.
- The CTA text is `创建习惯`.

## Flow 16A: Start Habit Creation From Empty State

1. User switches to the `行为习惯` tab.
2. User sees the empty state.
3. User clicks `创建习惯`.
4. The app opens a dedicated `行为习惯管理` page.

Acceptance notes:
- The CTA now resolves to a dedicated page rather than an unspecified flow.
- The management page is documented in `docs/page-specs/habit-management-page.md`.

## Flow 16B: Open Habit Management

1. User enters the homepage.
2. User opens the `行为习惯` entry surface.
3. The app opens the dedicated `行为习惯管理` page.
4. User sees:
   - back navigation
   - page title and subtitle
   - top actions `新建习惯` / `导入其他用户习惯` / `添加默认习惯`
   - empty or populated management body
   - a populated-state selection bar with `全选` / `清空选择` / `批量删除`
   - habit rows with checkbox, icon, compact tags, and edit/delete/reorder affordances

Acceptance notes:
- The screenshots now confirm both empty and populated management states.
- `新建习惯` and `创建第一个习惯` should resolve to the same modal.

## Flow 16C: Create A Habit From Management

1. User enters `行为习惯管理`.
2. User clicks `新建习惯` or `创建第一个习惯`.
3. A floating `新建习惯` modal opens.
4. User fills habit name, optional description, habit type, points, approval setting, icon, and color.
5. User confirms with `创建`.
6. The modal closes and the habit becomes available in the local habit surfaces.
7. The dedicated management page refreshes into a populated list row.
8. The homepage `行为习惯` board also refreshes and shows the new habit card.

Acceptance notes:
- The modal dropdown visibly supports `每日一次`, `每日多次`, and `每周多次`.
- Points input explicitly allows both positive and negative values in the range `-100` to `100`.
- The post-create populated management page and homepage board are now confirmed by screenshots.

## Flow 16D: Filter Habits On The Homepage

1. User enters the populated `行为习惯` board.
2. User optionally changes the selected day in the week strip.
3. User types into the search field, changes one filter chip, or toggles the board layout.
4. The visible habit-card set refreshes locally without leaving the homepage shell.

Acceptance notes:
- The visible filter chips are `全部` / `加分` / `扣分` / `已完成` / `待完成` / `每日多次` / `每周多次`.
- A reset control exists in the same toolbar row as the search field.

## Flow 16E: Delete Habits From Management

1. User enters the populated `行为习惯管理` page.
2. User either deletes a single row or selects multiple rows.
3. User confirms deletion.
4. The selected habits disappear from both the management list and the homepage habit board.

Acceptance notes:
- The populated management page explicitly shows both row-level delete and batch delete affordances.
- The screenshots confirm deletion entry points, but not a dedicated confirmation dialog design.

## Flow 16F: Check In A Habit From The Homepage

1. User enters the populated `行为习惯` board.
2. User clicks the blue `打卡` button on one habit card.
3. A floating `习惯打卡` modal opens.
4. User optionally writes note text.
5. User optionally enables `调整本次积分` and changes the per-check-in score.
6. User confirms with `确认打卡`.
7. The modal closes and the selected date reflects one more local habit completion.

Acceptance notes:
- The modal shows the current habit name near the top.
- `调整本次积分` reveals a numeric field with the visible range `-1000` to `1000`.
- The score summary card updates to reflect the resolved points for this single check-in.
- This is a modal confirmation step, not an immediate one-click write.

## Flow 16G: Open Habit Statistics

1. User enters the populated `行为习惯` board.
2. User clicks `数据统计`.
3. The app opens a dedicated `行为习惯统计` page.
4. User sees:
   - back navigation
   - top summary cards for check-ins, points, habit count, and average points
   - range chips `本周` / `本月` / `历史记录`
   - empty or populated analytics body

Acceptance notes:
- The provided screenshot confirms the empty statistics state.
- `去打卡` from the empty state should return the user to the homepage habit board.

## Flow 16H: Switch Habit Statistics Range

1. User enters `行为习惯统计`.
2. User clicks one range chip: `本周`, `本月`, or `历史记录`.
3. The summary cards and analytics body refresh for the selected range.

Acceptance notes:
- Range changes are local view-state updates, not page navigations.
- Only one range chip is active at a time.

## Flow 16I: Open Electronic Pet Center

1. User enters the homepage.
2. User clicks the `电子宠物` summary card.
3. The app opens a dedicated `电子宠物` page.
4. If no pet has been adopted yet, the page shows:
   - top bar with back navigation and current star balance
   - a gradient intro hero
   - a multi-card adoption grid
5. If one or more pets have already been adopted, the page shows the currently active pet interaction workspace instead.

Acceptance notes:
- This is a full page, not a modal.
- The same entry must handle both the first-adoption state and the post-adoption interaction state.

## Flow 16J: Adopt The First Electronic Pet

1. User enters the empty `电子宠物` adoption state.
2. User reviews pet cards with name, description, and star cost.
3. User clicks `领养` on one pet card.
4. If the current star balance is sufficient, the app deducts stars, records the adoption locally, and makes that pet active.
5. The page transitions into the populated interaction layout for the new pet.

Acceptance notes:
- Adoption must fail cleanly when balance is insufficient.
- Adoption spends from the same local star ledger used by rewards and habits.

## Flow 16K: Interact With Or Switch Pets

1. User enters the populated `电子宠物` page.
2. User sees the active pet stage, growth ladder, need cards, interaction actions, and the `更换宠物` list.
3. User can choose one interaction such as `喂食`, `洗香香`, `去公园`, or `睡觉`.
4. The app updates the active pet's local intimacy and need values without leaving the page.
5. User can also switch to another already owned pet from the right-side list, or adopt another unowned pet if enough stars remain.

Acceptance notes:
- Switching to an already owned pet should not spend stars again.
- Adopting another pet from the roster should both spend stars and make that pet active immediately.

## Flow 16L: Open Usage Help Center

1. User enters the homepage.
2. User clicks the `使用帮助` summary card.
3. The app opens a dedicated `使用帮助` page.
4. User sees:
   - a warm gradient header with back navigation
   - a quick-start guide card
   - a detailed plan-field explanation card
   - a two-column grid of feature help cards
5. User can click `前往功能` on a help card to jump into an implemented module or a placeholder entry point.

Acceptance notes:
- This is a full page, not a modal.
- The help page is product documentation for the current local-first slice and should stay in sync with implemented modules.

## Flow 16M: Open Other Features Hub

1. User enters the homepage.
2. User clicks the `其他` summary card.
3. The app opens a dedicated `其他功能` page.
4. User sees:
   - a dark hero header with back navigation
   - a `微信客服` information card with a QR-style visual
   - a search field for module names
   - grouped feature cards across membership, general, system, school, and other categories
   - an `应用信息` card and a final explanatory note card

Acceptance notes:
- This is a full page, not a modal.
- The page works as a grouped navigation hub for secondary product modules.

## Flow 16N: Search Or Open A Feature From The Hub

1. User enters `其他功能`.
2. User optionally types a keyword such as `宠物`, `习惯`, or `帮助`.
3. The card list filters locally and hides sections with no matches.
4. User clicks one feature card.
5. If that module is already implemented, the app navigates directly to it.
6. If that module is still pending, the app shows a lightweight placeholder notice instead.

Acceptance notes:
- Search is local UI state only.
- Cards should remain clickable even before their downstream pages are implemented.

## Flow 17: Open Points And Achievements Center

1. User enters the homepage.
2. User clicks the `积分成就` summary card.
3. User enters the dedicated `我的积分和成就` page.
4. User sees:
   - current star balance
   - week/month/consumption summaries
   - optional daily earning guidance
   - entry cards for `成就系统` and `积分历史`
   - wishlist management area

Acceptance notes:
- This is a full page.
- The page is both a summary view and a navigation hub.

## Flow 18: Review Remaining Earning Opportunities

1. User opens `我的积分和成就`.
2. If there are unfinished earning opportunities today, the page shows `今日还可获得`.
3. User reads remaining tasks and potential star rewards.

Acceptance notes:
- This panel is conditional and should disappear when not applicable.

## Flow 19: Manage Wishlist Rewards

1. User opens `我的积分和成就`.
2. User views the `我的愿望清单` section.
3. User can sort wishes, add a new wish, edit an existing wish, delete a wish, or redeem a wish.

Acceptance notes:
- The empty state and populated state are both explicitly shown in the reference screenshots.
- Redeem eligibility depends on current star balance.

## Flow 20: Add A Wish

1. User opens `我的积分和成就`.
2. User clicks `添加愿望` or `添加第一个愿望`.
3. A floating `添加我的愿望` modal opens.
4. User chooses an icon or uploads a custom image.
5. User fills:
   - `愿望名称`
   - `愿望描述`
   - `分类`
   - `需要多少星星`
6. User chooses one redemption mode:
   - `单次兑换`
   - `多次兑换`
   - `循环愿望`
   - `永久愿望`
7. User confirms with `添加愿望`.

Acceptance notes:
- This is a modal flow, not a full page.
- The reference explicitly shows all four redemption modes.
- Mode-specific fields change based on the selected mode.

## Flow 21: Finish Wish Creation

1. User submits a valid `添加我的愿望` modal.
2. The modal closes.
3. A success toast appears in the bottom-right corner.
4. The wishlist refreshes and shows the new wish card in the appropriate group.

Acceptance notes:
- Toast copy confirms success and reminds the user of the required star cost.

## Flow 22: Edit A Wish

1. User opens `我的积分和成就`.
2. User clicks the edit action on a wish card.
3. The `添加我的愿望` modal opens with existing values prefilled.
4. User updates the fields and saves.
5. The same wish card refreshes in place.

Acceptance notes:
- Edit reuses the add-wish modal shell rather than opening a different page.

## Flow 23: Delete A Wish

1. User clicks the delete action on a wish card.
2. A destructive confirmation modal opens.
3. User either cancels or confirms deletion.
4. If confirmed, the wish is removed from the wishlist immediately.

Acceptance notes:
- The delete modal explicitly states the action cannot be undone.

## Flow 24: Redeem A Wish

1. User clicks `兑换` on a wish card.
2. A confirmation modal opens with wish summary and current star balance.
3. The page compares wish cost against current balance.
4. If balance is sufficient, the user can confirm redemption.
5. If balance is insufficient, the confirm action is blocked and shortage is explained.

Acceptance notes:
- Redemption availability is balance-dependent.
- The same flow should still respect the wish's redemption mode limits.

## Flow 25: Open Star Rules Popover

1. User opens `我的积分和成就`.
2. User clicks `如何获得？`.
3. An anchored rules popover opens.
4. User sees the core earning rules at a glance and a `查看完整规则` action.

Acceptance notes:
- This first step is a popover, not a full navigation jump.

## Flow 26: Open Full Star Rules Page

1. User opens the rules popover from `如何获得？`.
2. User clicks `查看完整规则`.
3. User enters the dedicated `星星积分规则` page.
4. User can review base earning rules, bonus multipliers, streak rewards, achievements, and wish usage guidance.

Acceptance notes:
- The full rules page is the canonical explanation surface for star earning and spending.

## Flow 27: Open Achievement System

1. User opens `我的积分和成就`.
2. User clicks `成就系统`.
3. User enters the dedicated `成就系统` page.
4. User sees:
   - achievement summary metrics
   - empty or populated achievement state
   - instructional tips panel

Acceptance notes:
- The current reference only shows the zero-achievement state.
- The page still needs to be designed for future populated states.

## Flow 28: Open Points History

1. User opens `我的积分和成就`.
2. User clicks `积分历史`.
3. User enters the dedicated `积分历史` page.
4. User sees:
   - time-range filters
   - summary cards
   - record-type tabs
   - empty or populated record list
   - tips panel

Acceptance notes:
- This is a full page.
- The current reference includes both empty and populated states.

## Flow 29: Filter Points History By Range

1. User opens `积分历史`.
2. User selects one of the range chips:
   - `全部`
   - `近7天`
   - `近30天`
   - `近90天`
   - `自定义`
3. The page updates the visible date range, summaries, and record list.

Acceptance notes:
- `自定义` is visible as an option even though its picker UI is not yet shown.

## Flow 30: Filter Points History By Record Type

1. User opens `积分历史`.
2. User switches between:
   - `全部记录`
   - `获得`
   - `消费`
3. The page filters the current range to the selected record type.

Acceptance notes:
- The reference shows `全部记录` and `获得` populated styles.
- `消费` exists as a tab even though its populated state is not shown yet.
