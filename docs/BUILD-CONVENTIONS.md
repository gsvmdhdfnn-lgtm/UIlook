# Build conventions (pass 12)

UIlook is a static, mock-data prototype. It has no backend, no network
calls, no build step and no dependencies. Everything below applies to every
screen.

## Files
- **Mock data** lives only in `js/data/*.js`. Each data file adds read and
  write helpers to `Hub.db`, for example `db.getPlayers()`,
  `db.getInvoice(id)` or `db.setMark(...)`.
- **Screens** live in `js/screens/*.js`. They register
  `Hub.screens['route'] = function (ctx) { ... }` and read data only
  through `Hub.db`. No inline mock data in screen code: lists, names, prices
  and dates all come from `js/data`.
- **Area styles** go in `css/areas/<area>.css`, built on the tokens and
  classes in `css/kit.css`, `css/layout.css` and `css/components.css`.

## Kit (`Hub.kit`, usually `K`)

| Helper | Use |
|---|---|
| `K.route(id, { title, parent: 'home' or 'more', nav })` | Registers a route's title and its place in navigation |
| `K.head({ back: [route, label], eyebrow, title, sub, actions, tabs })` | Page head |
| `K.page(head, body)` | Page wrapper |
| `K.section(title, sub, body, right)` | A titled block on a page |
| `K.card({ title, sub, right, body })` | A card |
| `K.grid(items, 2 or 3 or '21')` | A grid of cards |
| `K.stats([...])` | A row of figures |
| `K.tiles([...])` | Navigation tiles |
| `K.tabs(id, list)` | Tabs; read the selected one with `K.tab(id, list)` |
| `K.seg(id, list)` | A segmented filter (same state store as tabs) |
| `K.table({ cols, head, rows: [{ cells, route }] })`, `K.cell(title, sub)` | A list with columns; a row can open a route |
| `K.kv(pairs, grid)` | Labelled details |
| `K.timeline(items)` | History of changes |
| `K.steps(list, i)` | Wizard progress |
| `K.form([K.field(label, K.input(name, value) or K.select(...) or K.textarea(...))])` | Forms; read values back with `K.val(name)` |
| `K.toggle(on, action, data, label)` | On/off switch |
| `K.money(pence)` | Money is held in pence and shown as £ with two decimals |
| `K.d`, `K.dd`, `K.dm`, `K.dt` | Dates. The clock is fixed at Thursday 1 October 2026, 14:10; `K.now()` gives the next minute for new actions. |
| `K.stamp(verb, who, at)` | "Recorded by Josh Evans, 24 Sep 14:32". Shown on every action. |
| `K.frozen('Issued · frozen')` | Badge for immutable history. Issued figures never get an edit button. |
| `K.restricted(['management', 'parent', 'coach:lead'], html, 'Medical details')` | Sensitive details: shown only to allowed viewers, otherwise a locked notice |
| `K.feature('communications')`, `K.featureOff(key)` | Feature switches |
| `K.fin()` | Finance access: `'none'`, `'view'` or `'manage'` |
| `K.viewer()` | `{ role: 'management', 'coach', 'parent' or 'public', coachRole: 'lead', 'coach' or 'learning' }` |
| `K.label('IDP')` | Renamable labels (Hub Settings) |
| `K.guard(ctx, head, { empty: [icon, title, body] })` | Returns the loading, empty or error page; call it first on every screen |
| `Hub.mutate(fn, toastText, logEntry)` | Changes in-memory state, records it in the audit trail, shows a toast and re-renders |
| `K.log({ area, summary, entity, before, after, restricted, finance })` | Writes an audit entry |
| `K.goBtn(label, route)`, `K.actBtn(label, action, data)`, `K.link(route, text)` | Buttons and links |

- **Routes** are `area-page` plus an optional `/ID`, for example
  `#mgmt-invoice/INV-0012`. Read the ID with `ctx.param`.
- **Every button** leads somewhere real or changes the mock state with a
  toast. Never use `data-action="soon"` or "not part of this visual pass".

## Wording
- **Product words only:** Coach, Player, Parent, Family, Session,
  Occurrence, Register, Invoice, Credit note, Membership, Booking.
- **Never storage words:** record (as a noun), table, base, row.
- Never mention Airtable, Supabase or Google Sheets.

## Every screen
- Works with both brands (Relvor and Josh Evans), light and dark, and at
  desktop and phone widths.
- Has loading, empty and error states (through the prototype bar's data
  state).
- Shows who did what and when.
- Keeps sensitive details (medical, support needs, emergency contacts, old
  and new values) restricted.
- Uses invented data only.
