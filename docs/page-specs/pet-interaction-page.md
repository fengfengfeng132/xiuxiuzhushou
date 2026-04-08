# Electronic Pet Interaction Page

## Source

- Derived from the post-adoption electronic-pet screenshot provided by the user on 2026-03-21.

## Page Goal

Show the currently active pet, its growth progress, care metrics, and interaction actions after at least one pet has been adopted.

## Layout Zones

### 1. Top Bar

- Reuses the same rounded top bar from the adoption page.
- Keeps back navigation, title, subtitle, and current star-balance pill.

### 2. Active Pet Showcase

- Large gradient stage on the left.
- Shows:
  - current level chip such as `Lv.2`
  - active pet name
  - species/type chip on the right
  - large pet visual in the middle
  - one line of current pet status copy below the visual

### 3. Need Cards

- Three compact cards under the main stage:
  - `饱腹`
  - `清洁`
  - `心情`
- Each card shows a `value/100` summary and a progress bar.

### 4. Interaction Actions

- Four colorful action cards below the need cards:
  - `喂食`
  - `洗香香`
  - `去公园`
  - `睡觉`
- Each action card includes a small gain chip and short helper copy.

### 5. Growth Panel

- Right-side card titled `成长进度`.
- Shows current intimacy value and the visible level ladder:
  - `Lv.1 刚认识`
  - `Lv.2 好朋友`
  - `Lv.3 好伙伴`
  - `Lv.4 最佳伙伴`

### 6. Switch-Pet Panel

- Right-side list titled `更换宠物`.
- Each row shows:
  - pet thumbnail
  - pet name
  - short description or owned summary
  - current state action such as `陪伴中` / `切换` / `领养`
  - owned-pet recycle action such as `回收 +25`
  - visible star cost for unowned pets

## Interaction Notes

- Interaction buttons update only the local pet state and do not leave the page.
- Switching to an already owned pet should not re-charge stars.
- Adopting a new pet from the right-side list should deduct stars and make it active immediately.
- Recycling an owned pet should remove it from the roster and refund `25` stars.

## States Required

- one active pet owned
- multiple pets owned with free switching
- unowned pets still visible in the switch list
- insufficient stars for adopting another pet
