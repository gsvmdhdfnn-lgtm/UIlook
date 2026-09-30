# Visual pass 7: Management Home from the reference

This pass recreates the supplied Management Home reference as closely as
possible in spirit. It covers **one page**: the Management Home. It is the
reference system for later areas once approved. No other page was redesigned.

Screenshots: `docs/screenshots/pass-7/`. Pass 6 is pinned as branch
`claude/visual-pass-6` for comparison.

## What changed

**Shell (every Management page, because it is shared)**
- The sidebar is now a floating obsidian card (12px inset, 22px radius,
  layered shadow) on a warm porcelain canvas. It replaces pass 6's dark
  spine and inset panel.
- The top has the Relvor logo and wordmark, then an organisation switcher
  card ("Switch organisation").
- One calm list of destinations follows. The active item has a warm champagne
  fill with an inner highlight, not a pill or an underline.
- The bottom holds Settings, Help & all tools, the Manage/Staff switch and
  the user card.
- Other Management pages keep their pass 6 content. They simply sit on the
  new canvas.

**Management Home**
- **Top bar:** search on the left; "Add new", notifications and the account
  on the right. There is no bar chrome.
- **Greeting:** a spaced small date above a large serif greeting, drawn over
  a misty, tonal ridgeline backdrop that fades into the canvas.
- **Summary cards:** four soft, translucent cards. Each has a single tinted
  status circle (decision, approval, sessions, players).
- **Primary surfaces:** Today's schedule and Needs attention each get a
  large surface with calm rows.
  - Schedule rows show a status bar, stacked times, the venue, the player
    count and On track / At risk.
  - Attention rows show a severity dot, the title, the due time and the
    area.
- **Right rail:** quieter and translucent, with no heavy shadow.
  - Today has a week strip with the day selected in dark, and a timeline.
  - Recent activity sits below it.
- **Feature panels:** the one richer zone, in deep teal, clay and graphite.
  Each has a serif title, abstract light shapes and a pill CTA. They link
  to the existing Schedule, People and Finance destinations.

## Rules kept
- Status green, orange and red stay separate from the brand accent. Bronze
  is used only for "Add new" and the active nav.
- Borders are nearly gone. Separation comes from tone, whitespace and soft
  layered shadow.
- Glass is used only on the search, the summary cards and the rail, not on
  every card.
- Motion uses one easing curve over 160–240ms: hover lift on cards and
  panels, a chevron nudge, and a light drift on the feature panels. Reduced
  motion is respected.
- Every destination, count and item comes from the existing mock data and
  routes. Nothing new was invented. The "Add new" and organisation switcher
  buttons are inert, like other placeholder actions.

## Responsive
- **Wide desktop:** main column plus a 320px rail.
- **Up to 1320px:** the rail moves below; summary cards go 2×2 and the two
  surfaces stack.
- **Phone:** everything stacks, and the feature panels come before the rail.

## Five-second check
Against the reference, the render reads as high-end within five seconds:
- a dark floating spine against warm porcelain;
- a confident serif greeting over a soft landscape;
- generous, quiet operational surfaces;
- one richer branded band at the bottom.

The differences are deliberate:
- The backdrop is vector ridgelines, not a photo.
- Row content is the prototype's real data.
