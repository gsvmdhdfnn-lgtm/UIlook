# Visual pass 11: hierarchy and focus

These refinements sit on top of pass 10. The palette, proportions,
navigation and behaviour are unchanged. The new stylesheet is
`css/refine.css`, and screenshots are in `docs/screenshots/pass-11/`.

## Headings
One scale is used on every Management, Coach and Parent screen:

| Level | Desktop | Phone |
|---|---|---|
| Page title | 28px / 600 | 24px |
| Section heading | 19px / 600, full contrast | 17px |
| Card title | 15px / 600 | 15px |
| Supporting text | 13–14.5px, muted | same |

- Today's schedule and Needs attention on Home are working panels, so they
  use the section size.
- The rail cards (Calendar, Recent activity) and the cards inside sections
  use the card-title size.

## Management Home
- **Calendar panel:** a compact date selector only. The duplicated session
  list is gone; one summary line remains ("4 sessions · first 15:30 · last
  ends 20:30").
- **Issue titles** in Needs attention wrap onto two lines rather than being
  truncated.
- **Phones:** a compact urgent summary sits above Today's schedule. It shows:
  - the counts;
  - each urgent item with its title and timing (tap to open the item);
  - a Review link that jumps to the full Needs attention panel.

  There is no large banner: it's a white card with a thin red edge.

## Parent Home
- The navigation tiles (Billing & Payments, Memberships, Child profile,
  Browse sessions) are now light cards with small amber icon chips.
- Next Session remains the only dark, featured card.
- The feedback quote text is reduced to 15px to suit its supporting role.

## Coach Home (phone)
- The navigation cards stack the icon above the title, so text no longer
  truncates.
- The next-session buttons stay on one line.
