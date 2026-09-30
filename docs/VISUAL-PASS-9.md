# Visual pass 9: design-pack layout, Relvor finish

The supplied Josh Evans Hub design pack is now the reference for page
structure, tabs, grouping and navigation. The look is unchanged:
- the serif greeting and bold sans headings;
- porcelain surfaces, glass, soft gradients and layered shadows;
- the palettes;
- the motion.

Existing behaviour is kept:
- Case drawers, person drawers, filters and member switching all still work.
- Every destination still resolves.

Screenshots are in `docs/screenshots/pass-9/`.

## Navigation
- **Management top level:** Home and More only, as the pack sets out.
- **Core areas:** Needs attention, Schedule & Sessions, Coaches (Staff) and
  Players & Parents are reached from Home.
- **Under More:** Development, Communications, Content & Brand, Finance,
  Reports, Settings & System, approvals and account.
- **Desktop sidebar:**
  - shows Home and More, with the area you're in nested under its parent;
  - has a compact Needs Attention status card;
  - keeps the organisation card, now labelled "Management hub", and the
    hub switch.
- **Phone tab bar:** Home (with the urgent count) and More.
- **Area pages:** each has a back link to its parent, and the breadcrumbs
  follow the same tree.

## Screens

| Screen | Pack layout applied |
|---|---|
| Management Home | Greeting; Needs Attention hero card coloured by its current state (urgent, warning, normal or clear) with the top three items; area cards for Schedule & Sessions, Coaches, Players & Parents and Today; summary chips; then today's schedule and the rail |
| Needs attention | Severity filter (All, Urgent, Warning, Normal), a category select, and one card per issue: severity, what's wrong, what it affects, one clear action |
| Coaches / Staff | Add and cover actions, the "At a glance" row, then a card directory with status pills |
| Players & Parents | Four figures (Needs action highlighted), then Players and Parents entry cards; a preview link to the Parent hub |
| Schedule & Sessions | All Sessions as the main workspace card, with Calendar and Venues beside it, then today's table. All Sessions opens grouped by day, with fill bars, and Venues lists real venues. |
| Finance | Section tabs (Overview, Money in, Money out, Cash flow, Month report), a period selector, four headline figures, Needs attention beside Upcoming payments, work areas and the cash position band |
| More | Two groups from the pack (Development & Communication; Business & System), then approvals and account |
| Coach Home | Next session as the hero, then Player Hub, My schedule, Library and Support |
| Parent Home | Family schedule with the child switch; the next session as the hero; current actions; four tiles (Billing & Payments, Memberships, Child profile, Browse sessions); the combined dated schedule; recent feedback. Desktop places them in two columns; phone follows the pack's order. |

## Data
New mock data:
- session capacity, for the fill bars;
- a parent's combined upcoming sessions;
- the Finance overview figures, taken from the pack's own example values.

The pack's rules say sample content isn't a rule; nothing here implies new
business logic.

## Not in this pass
- Calendar views.
- Finance sub-sections other than Overview.
- Player and parent lists.

Each of these keeps its place with a placeholder.
