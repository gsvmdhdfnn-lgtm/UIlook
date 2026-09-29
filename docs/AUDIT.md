# Visual audit of the current Hub

Source inspected (read-only): `gsvmdhdfnn-lgtm/Coach-allocation-TEST`, branch
`foundation/test-base-isolation` at `b413986` (the newest branch; its frontend
files are identical to `main` and to `main`'s `/test/` build). I ran it locally
against the repo's own Playwright mock servers, as Management, Coach and
Parent, at 390px and 1280px wide. Nothing in that repo was changed.

## What the frontend is today

- A single-page vanilla JS app: `core.js` (shell, routing, More sheet),
  `coach.js`, `management.js`, `parent.js`, `feedback.js`, with one
  `styles.css` of 425 very long lines (~70 KB).
- **Coach:** Home, Schedule (Today / This Week / Calendar), Library,
  Player Hub, Venues, Coach Support, session detail and the feedback flow.
- **Management:** there is no Management Home yet. Management users land on
  the Coach Home. Management tools are rows in the More sheet: Coach
  Management, Session Requests, Player Migration and Parent Claims, plus a
  password-gated "Management & Financials" screen with four KPI tiles.
- **Parent:** Home, Sessions, Development, More (policies, Children & Access,
  a "Payments & Bookings: coming soon" card).
- **Needs Attention, Schedule & Sessions, Coaches, Players & Parents and
  Finance are backend-only so far.** The `needs-attention` function has a
  full display contract (severity, title, detail, action label, destination
  area), and the Destination Areas and Feature Controls modules are defined.
  The frontend doesn't render any of it yet, so this prototype designs those
  screens against the contract, not against an existing UI.

## What already works (keep)

- **The information architecture.** The four tabs per role, drilling deeper
  one level at a time (Home, then Session, then Player), bottom sheets for
  detail, and the Parent Hub built around the family rather than one child.
- **The Next Session card** as the lead element on Coach and Parent Home.
  It is the most-used thing in the app and it deserves the emphasis.
- **Plain, operational copy** that fails visibly. "Today's cancellations and
  cover couldn't be loaded" is a deliberate rule: never show a covered
  session as normal because a feed silently failed. The prototype keeps
  that copy and the rule.
- **Branding that already flows from data.** Organisation & Branding colours
  are written onto CSS variables at runtime, which is the right mechanism.
- **Considered empty states** (for example "No sessions today. Your next
  session is U9/10 Development, Thursday.").

## What feels inconsistent or unfinished

| Area | Finding |
|---|---|
| Type scale | 30 different font sizes. 90 declarations are below 11px (as small as 7px) and another 42 are exactly 11px. Most secondary text is too small to read on a phone. |
| Type voice | Anton (condensed, uppercase) and Inter mixed with no rule. Coach Home uses shouting uppercase headings ("TODAY'S SESSIONS") while Parent uses sentence-case bold for the same pattern ("Next Session"). |
| Weights | Six weights (600–900), with 800/850/900 as the everyday default, so nothing stands out. |
| Radius | 16 different radii (6px to 24px) for what are really four sizes. |
| Colour | 147 distinct hex values in the stylesheet. Brand variables are named after colours (`--navy`, `--blue`, `--lime`), so a white-labelled org gets a variable called `--lime` holding purple. |
| Shadows | 23 box-shadow variants. |
| Duplicated patterns | The same component exists several times under different names: `page-title` vs `hero` vs `ph-hero`, `section-head` vs `home-section-title` vs `ph-section-head`, `support-row` vs `more-row` vs `pending-row` vs `request-row`, `empty-state` vs `ph-empty` vs `schedule-empty`, `card` with inline `style=""` overrides. |
| Management surfaces | Management sub-screens render as uppercase cream text on a full-bleed blue page (`.locked`). They look like a different product from the Coach screens around them. |
| Buttons | Lime is used for most primary buttons on white. Full-width buttons appear inside desktop layouts ("Sync Sessions from schedule" spans 1000px+). Secondary buttons vary between outlined, ghost-blue and white. |
| Icons | Unicode glyphs (● ▣ ▤ ⌖ ◷ ◉). Several different items share "●" (My Profile, Feedback, Parent Claims, Coach management), and the glyphs render differently on each platform. |
| Header | The stacked logo is about 44px tall in the top bar, so "Soccer School" is unreadable. The logo has a solid white background and can't sit on any other colour. |
| Navigation | A pill tab bar sits under the header on mobile. It's out of thumb reach, sticky, and costs about 70px of height on every screen. Management has no navigation of its own; it lives in a sheet. |
| Desktop | Content column is 1080px but most screens are single-column mobile layouts stretched (Coach Home centres a 490px column in a 1280px window; buttons go full-width). |
| Mobile | Parent Home overflows horizontally at 390px (content runs edge to edge and scrolls sideways by ~14px). The top nav's labels are 13px uppercase Anton inside 46px pills. |
| States | Loading is one centred spinner for every screen; errors are pink boxes with centred text; there's no consistent success state beyond the toast. |

## Direction tested

1. **One token system with three layers:** brand (three colours plus a display
   face, supplied per organisation), system (neutrals, status, type, space,
   radius, elevation) and role (what components actually use). Components
   never see a brand colour directly.
2. **A calmer, more legible type system:** Manrope for all interface text on a
   seven-step scale with a 12px floor and 15px body. The brand display face
   (Anton for Josh Evans) is kept for one "brand moment" per screen: the
   Next Session title and the Parent greeting. Management uses none.
3. **Colour by role:** navy for the strong surface and primary actions, blue
   for links, focus and active states, and lime limited to one highlight per
   screen (the main action on a Next Session card, the active-tab marker).
   Status colours are semantic and separate from the brand.
4. **One shell for all three areas,** with emphasis set by area rather than by
   separate stylesheets:
   - On phones every area uses a bottom tab bar.
   - On desktop, Management gets a sidebar holding all areas.
   - On desktop, Coach and Parent get tabs in the top bar and a two-column
     layout.
5. **One component per pattern** (page head, section head, card, row, pill,
   alert, empty, sheet), so screens compose rather than restyle.
