# Relvor: pass 6, "Atelier"

This pass is about perceived quality: how the product feels in the first few
seconds. Structure, tab naming, workflows and content are unchanged. All of it
lives in one stylesheet (`css/atelier.css`) plus new tokens, and a few lines
of JavaScript handle motion.

## The four moves

### 1. The obsidian spine and the inset panel

- **Spine:** Management's sidebar is now a dark graphite object, the same in
  both themes.
- **Panel:** the workspace sits beside it as a warm porcelain panel, inset
  10px from the window and rounded 22px, like a display set into a bezel.
  That single contrast gives the product its silhouette.
- **On the spine:**
  - quiet warm-grey type;
  - the selected module lifts slightly, with its icon in the accent colour;
  - state marks are re-tuned for dark;
  - the organisation carries a small green live dot.

### 2. The glide rail: one navigation instrument everywhere

- **Every tabbed navigation is a frosted rail:**
  - module sections;
  - the Staff and Client top bars;
  - the phone tab bar.
- **The raised selector:**
  - a porcelain "puck" with a layered shadow and a short amber tick sits
    under the current tab;
  - when you change tab it glides there over 440ms with a decelerating
    ease; it doesn't jump;
  - it remembers where it was across full re-renders, so the glide is always
    from the previous position.
- **Tabs stay tabs.** Section tabs keep two lines (name, plus a live status
  line with its state mark), so they read as real sections, like the Hub's
  tabbed screens, but as an instrument rather than chips.
- **Sections enter from the side you moved toward.** The content slides in
  from the right when you move right and from the left when you move left.

### 3. Editorial type, with restraint

- **Instrument Serif** (the high-contrast display companion to the Instrument
  Sans already in use) appears in only four places:
  - greetings;
  - module titles;
  - the next-session title;
  - the chapter headings that divide a page.
- **Everything operational stays sans:** rows, tables, buttons and labels.
- **Chapters:** major zones open with a serif title, a quiet meta line and a
  hairline rule that fades to the right ("Today", "Decisions", "Also on your
  list"). That gives each page a clear, editorial rhythm and a strong
  separation between zones.
- **Brief facts:** live facts in the Brief are now quiet underlined words
  instead of shaded chips, which is less noise.

### 4. Depth only where things float

- **Glass** (translucent, 18px blur) on shell elements only:
  - the workspace context bar;
  - the Staff/Client top bar, which now floats 14px from the window edge;
  - the phone tab bar, now a floating capsule;
  - the tab rails.
- **Layered shadows** on floating things only:
  - the selector;
  - drawers;
  - decision cards and Day Line blocks on hover;
  - primary buttons, with a subtle tonal gradient and inner highlight.
- **Drawers glide.** They slide in and out rather than pop, over a softly
  blurred page, and they're inset 14px from the edge with 24px corners.
- **Hover elevation.** Rows and tables lift 1px with a soft shadow.
- **Press.** Buttons compress to 98%.
- **Porcelain ground.** A gentle top light fades into warm stone.
- **Reduced motion.** If the user asks for less motion, the glide, lift and
  drawer motion all switch off.

## Less at once

- **Management Home is four zones:** Brief, Today (the Day Line), Decisions,
  and three items from the rest of the list. The approvals and tomorrow side
  column is gone; approvals already appear in the Brief, and tomorrow lives
  in Schedule.
- **Staff Home** drops "Later this week".
- **Client Home** drops the payments note.

## Palette

- Warm porcelain and stone for surfaces.
- Obsidian and graphite for the spine and text.
- One restrained accent: bronze-amber for Relvor, or the organisation's own,
  adjusted for contrast. For Josh Evans the spine, glass and serif stay the
  same and only the accent becomes their blue.

## Motion values

| Token | Value | Used for |
|---|---|---|
| `--dur-1` | 160ms | hover, press |
| `--dur-2` | 280ms | state changes, drawer close |
| `--dur-3` | 440ms | the selector glide, drawer open, section entry |
| `--ease-out` | cubic-bezier(.22, 1, .36, 1) | everything that arrives |

## Screenshots

`docs/screenshots/pass-6/`: the standard set, module and tab views, both
drawers, phone, dark, and the Josh Evans brand.
