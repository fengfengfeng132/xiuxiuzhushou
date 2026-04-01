# Electronic Pet Adoption Page

## Source

- Derived from the electronic-pet adoption screenshot provided by the user on 2026-03-21.

## Page Goal

Provide a dedicated page where the user can spend local star points to adopt a first electronic pet.

## Layout Zones

### 1. Top Bar

- White rounded top bar with:
  - back button on the left
  - title `电子宠物`
  - short subtitle explaining that stars can be exchanged for a companion
  - current star-balance pill on the right

### 2. Intro Hero

- Large gradient banner under the top bar.
- Kicker chip like `轻松陪伴型`.
- Main title `领养一只属于你的电子宠物`.
- Support copy describing that feeding, cleaning, and outings deepen companionship.

### 3. Adoption Grid

- Multi-column grid of pet cards.
- Each card shows:
  - large pet visual
  - pet name
  - short personality description
  - orange cost chip such as `100 星星领养`
  - blue `领养` button

## Interaction Notes

- Clicking `领养` spends stars and immediately turns the chosen pet into the active companion.
- If stars are insufficient, the adopt action must be blocked with clear local feedback.
- The page should remain valid even when many pet options exist.

## States Required

- enough stars to adopt
- not enough stars to adopt
- first pet adopted and page transitions into the interaction view
