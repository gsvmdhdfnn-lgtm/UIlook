# Relvor: pass 4, section navigation

This pass refines how people move within a module. Everything else is pass 3
unchanged.

## Two levels, two jobs

- **Sidebar: where you are in the platform.** It lists modules: People,
  Schedule & Sessions, Finance, and so on. It's unchanged from pass 3.
- **Section tabs: which part of that module you're viewing.** Examples:
  Staff, Clients and Families; or Today, This week, Calendar, Sessions and
  Locations.
- **Breadcrumb:** the context bar joins the two, for example
  "Management › People › Staff".

## The workspace header

Every module now opens with the same header, on a quiet tonal band across the
top of the workspace:

- the module title (30px) and one line of context, for example
  "9 open · 2 urgent · Updated 14:05", where only risk takes colour;
- the module's actions on the right, with at most one primary button;
- the section tabs along the band's lower edge.

**The selected tab is cut from the page surface itself.** It shares the
workspace tone and flows into the content beneath it, with small inverted
corners where it meets the page. That reads as "you are here" the way a
paper folder tab does:
- no underline, pill or outline;
- nothing new to learn: it looks like a tab;
- calm enough to sit above a 50-row table.

## Proportions

- Tabs are 50px tall with 22px of horizontal padding and 15px medium labels.
  That's the same size as body text, so they read as destinations, not
  controls.
- Counts sit beside the label in a lighter tone. A section with urgent items
  shows a small red dot and count; nothing else takes colour.
- The band has 48px above the title and 32px between the title block and the
  tabs. The page content starts 40px below the tab edge.
- Unselected tabs are secondary text; hover lifts them halfway toward the
  page tone.
- On a phone, the tabs scroll sideways. They're 46px tall and 16px each side,
  with the next tab visible at the edge so people can tell the row scrolls.
  Module actions share the width below the title.

## Where it's applied

| Module | Tabs | Notes |
|---|---|---|
| Needs attention | All items · Staffing & Cover · Coaches & Compliance · Sessions & Venues | Replaces the tonal filter pills from pass 3. |
| People | Staff · Clients (Parents under Josh Evans) · Families | Staff shows the table. The other tabs keep their place. |
| Schedule & Sessions | Today · This week · Calendar · Sessions · Locations | Mirrors the Hub's existing Today / This week / Calendar views, plus sessions and venues. Today and This week are built. |
| Finance | Overview · Billing · Invoicing · Session finances · Staff costs | Finance access is separate from Management in the product, so the module shows its structure over a restricted state. |

Schedule & Sessions and Finance were placeholder destinations until now. They
now open inside the shell so the navigation can be judged at module scale.
No new product features were added: every tab maps to a view the Hub already
has or an area the backend already defines.

## Staff and Client

- Their top-level tabs (Home, Schedule, Library…) are the equivalent of the
  sidebar, so they keep pass 3's spaced, raised treatment.
- If a Staff or Client module ever needs sections, the same workspace header
  applies on their page ground.

## Screenshots

In `docs/screenshots/pass-4/`:
- the standard set;
- `desktop-mgmt-schedule*` and `desktop-mgmt-finance`;
- `desktop-mgmt-attention-coaches` (a non-default tab);
- `phone-mgmt-coaches` and `phone-mgmt-schedule`;
- dark versions.
