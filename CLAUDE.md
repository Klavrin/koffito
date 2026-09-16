@AGENTS.md
# Koffito Design Guidelines

Koffito is a mobile app for meeting new people over coffee. The UI should feel **warm, playful, friendly, modern, and approachable** — like a cozy coffee shop, not a corporate networking or productivity app.

## Visual Style

* Use a **rounded, soft UI** throughout.
* Prefer generous border radii: cards, buttons, inputs, modals, sheets, containers.
* Use pill shapes for chips/tags.
* Avoid sharp corners and rigid rectangular UI.
* Use subtle shadows/elevation rather than heavy borders.
* Keep layouts clean and spacious.
* Use personality without clutter.

## Colors

Use a warm coffee-inspired palette with soft, slightly muted tones.

* Primary: coffee brown / caramel / warm terracotta
* Secondary: peach / muted orange / warm beige
* Background: cream / warm off-white
* Surface: white / warm white
* Text: dark brown instead of pure black
* Muted text: warm gray
* Success: soft green
* Error: soft red

Maintain good accessibility/contrast. Avoid neon or overly saturated colors.

## Typography

* Modern, clean sans-serif.
* Friendly but highly readable.
* Strong hierarchy between headings, body, labels, and captions.
* Headings can have personality; body text should prioritize readability.
* Avoid overly technical/futuristic typography.

## Components

Build reusable components with variants instead of duplicating UI.

Core UI:

* `Button` — primary, secondary, outline, ghost, destructive
* `IconButton`
* `Card`
* `Avatar`
* `Badge`
* `Chip`
* `Input`
* `SearchInput`
* `Header`
* `TabBar`
* `BottomSheet`
* `Modal`
* `Toast`
* `Skeleton`
* `EmptyState`
* `ErrorState`

Koffito-specific:

* `UserCard`
* `MatchCard`
* `MeetupCard`
* `MeetupStatus`
* `InterestChip`

## Buttons

Buttons are a key part of the visual identity.

* Rounded/pill-like.
* Comfortable padding and touch targets.
* Slightly chunky rather than thin.
* Warm primary color.
* Clear hierarchy between primary/secondary actions.
* Include subtle pressed/disabled/loading states.
* Examples: `Find someone`, `Let's grab coffee`, `Create meetup`, `Send message`.

## Cards

Cards should feel soft and friendly:

* Large rounded corners
* Generous spacing
* Warm surface colors
* Subtle elevation/shadow
* Clear hierarchy

Avoid dense information layouts.

## Avatars & Profiles

* Circular avatars.
* Make people feel human rather than like database records.
* Support optional status indicators/badges.
* Profile cards should prioritize photo, name, short description, interests, and relevant actions.

## Chips & Tags

Use rounded/pill chips for interests:

`☕ Coffee` `🎵 Music` `🎮 Gaming` `📷 Photography`

Selected states should be visually obvious while remaining within the warm palette.

## Icons

Use simple, friendly, rounded icons. Avoid overly sharp/geometric icon styles.

Coffee/social motifs can add personality, but don't overuse them.

## Empty States

Keep empty/error states friendly and playful rather than technical.

Prefer:

> No coffee buddies yet ☕
> There's always someone new to meet.

Use simple illustrations or coffee-related visual elements when appropriate.

## Navigation

* Keep navigation simple.
* Use rounded active states/pills where appropriate.
* Avoid excessive borders.
* Maintain the same rounded visual language as the rest of the app.

## Motion

Use subtle, fast animations for:

* Button presses
* Screen transitions
* Cards appearing
* Match/connection actions
* Bottom sheets
* Chip selection
* Loading states

Avoid excessive or distracting animations.

## Design Principle

**Koffito should feel like an invitation to meet someone, not a tool for managing people.**

The experience should evoke walking into a cozy café and meeting someone new: warm, spontaneous, social, and comfortable.

## Technical

* React Native
* NativeWind
* Prefer reusable, composable components.
* Keep styling consistent through shared design tokens/variants.
* Do not create one-off styles when an existing component/variant can be reused.
* When adding new UI, follow these guidelines unless a feature explicitly requires otherwise.
