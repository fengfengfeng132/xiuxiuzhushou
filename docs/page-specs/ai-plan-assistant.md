# AI Plan Assistant Spec

## Source

- Derived from the `AI 智能创建` screenshot provided on 2026-03-20.
- User clarification:
  - the user can send requirements to AI
  - AI converts them into the homepage learning plans

## Page Goal

Provide a conversation workspace where the user can describe study intentions in natural language or upload an image, then have the system turn that input into structured study plans.

## Entry

- Entered from the homepage `学习计划` board by clicking `AI添加` or `AI创建`.
- This is a dedicated page, not a modal.

## Header

- Back button on the top left.
- Center title: `AI 智能创建`.
- Clear action on the top right: `清空`.

## Layout

- Blue gradient top shell consistent with the rest of the app.
- Large centered workspace card.
- Narrow left sidebar for conversation history.
- Main chat panel on the right.
- Bottom input bar for prompt entry and send.

## Top Notice

- A warning/info banner appears near the top of the chat card.
- Visible copy indicates the AI feature is still in a trial phase and users should give feedback if recognition is inaccurate.

Requirement:
- The page should set appropriate expectation that AI output may need review.

## Left Sidebar: 会话历史

- Section title: `会话历史`
- `新会话` action button
- Empty-state copy when there is no prior history

Requirement:
- Sessions should be grouped as reusable local conversations.
- Starting a new session should clear the active conversation context without deleting all history.

Known unknown:
- No screenshot yet shows a populated history list.

## Main Empty State

- Centered AI icon
- Title: `AI 学习计划助手`
- Supportive description telling the user they can describe plans or upload images
- Example prompt chips, such as:
  - `每天晚上7点学习数学`
  - `每2天游泳一次`
  - `周末运动1小时`
- Secondary upload button: `上传图片`

Requirement:
- Example chips should be tappable shortcuts that seed the prompt input or start a request.
- Uploading an image is a first-class path, not a hidden advanced action.

## Bottom Composer

- Left icon/button for upload
- Main text input with placeholder roughly matching:
  - describe your study plan, image upload also supported
- Right send button

Requirement:
- User can submit text-only prompts.
- User can attach an image and submit.
- Composer should stay available throughout the conversation.

## Output Behavior

- AI output should be convertible into the same structured plan objects used elsewhere in the app.
- Resulting plans should become visible on the homepage learning-plan board after confirmation or save.

Assumption:
- The exact intermediate review UI between AI output and final plan creation is not shown yet.

## Interaction Notes

- `清空` likely clears the current draft conversation.
- `返回` returns to the previous plan board context.
- The chat experience should support multiple turns.

## States Required

- no history
- history present
- empty chat
- prompt typing
- image attached
- generating response
- AI returned parsable plan suggestions
- error or low-confidence recognition state

## Validation

Blocking:
- empty submission with no text and no image

Non-blocking:
- ambiguous prompt content, as long as the system can ask follow-up questions or return a draft

## Known Unknowns

- exact populated history row design
- exact structure of AI replies
- whether plan creation is automatic or requires confirmation
- whether multiple plans are shown as cards, list items, or inline structured text before save
