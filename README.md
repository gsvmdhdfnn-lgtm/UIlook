# Relvor UI

A visual-design prototype for Relvor, the operations platform (Josh Evans is
one example organisation using it). It is a static, mock-data front end for
trying out the look and feel. It is not a second Hub.

- **Pass 8, Home style everywhere (current):** `docs/VISUAL-PASS-8.md`, `docs/screenshots/pass-8/`. Bold sans headings and tabs; porcelain canvas, soft cards and obsidian shell across Management, Staff and Client.
- **Pass 7, reference Management Home:** branch `claude/visual-pass-7`; `docs/VISUAL-PASS-7.md`, `docs/screenshots/pass-7/`. Floating obsidian sidebar on porcelain; greeting, soft summary cards, primary surfaces, quiet rail, feature panels.
- **Pass 6, Atelier:** branch `claude/visual-pass-6`; `docs/VISUAL-PASS-6.md`, `docs/screenshots/pass-6/`. Obsidian spine, glide rail, editorial serif, glass and motion.
- **Pass 5, product identity:** `docs/VISUAL-PASS-5.md`, `docs/screenshots/pass-5/`. The Brief, the Day Line, state marks and decisions, index tabs.
- **Pass 4, section navigation:** `docs/VISUAL-PASS-4.md`, `docs/screenshots/pass-4/`.
- **Visual pass 3:** `docs/VISUAL-PASS-3.md`, `docs/screenshots/pass-3/`.
- **Visual pass 2:** branch `claude/visual-pass-2`; `docs/VISUAL-PASS-2.md`, `docs/screenshots/pass-2/`.
- **Visual pass 1:** branch `claude/visual-pass-1`, screenshots in `docs/screenshots/pass-1/`.

- The real product lives in `gsvmdhdfnn-lgtm/Coach-allocation-TEST`. This repo
  never changes it.
- There is no backend, auth, Supabase, Airtable or business logic here. Data is
  mocked in `js/data.js` using product concepts (Coach, Session, Occurrence,
  Player, Parent, Attention Case), not storage field names.

## Run it

No build step. Serve the folder and open `index.html`:

```bash
python3 -m http.server 8000
# then http://localhost:8000/
```

The dark bar at the top is prototype chrome. Use it to switch:
- **Role:** Management, Staff or Client (called Coach and Parent under the Josh Evans brand)
- **Data state:** data, empty, loading or error
- **Theme:** light, dark or auto
- **Brand:** Relvor's generic look (a fictional organisation), or Josh Evans
- **Visual system:** a reference page of every token and component

The prototype clock is fixed at Thursday 1 October 2026, 14:10, so "today"
always has sessions.

## Structure

```
css/tokens.css      brand -> system -> role tokens, light + dark
css/base.css        reset, type defaults, focus, reduced motion
css/components.css  page, section, card, stats, button, pill, badge, row,
                    tiles, avatar, profile header, key/value, alert, empty,
                    skeleton, form fields, segmented, chips, sheet, toast
css/shell.css       top bar, bottom tab bar, desktop sidebar, area switch
css/screens.css     per-screen composition only
css/signature.css   Relvor's signature patterns (Brief, Day Line, marks, decisions, index tabs)
css/atelier.css     pass 6: spine, inset panel, glide rail, serif chapters, glass, depth, motion
css/home.css        pass 7: floating sidebar shell and the Management Home composition
css/reference.css   pass 8: the Home style applied to every area (type, tabs, surfaces, shell)
js/brand.js         branding boundary (name, mark, accent, terms; accent clamped for contrast)
js/icons.js         stroke icon set
js/ui.js            component helpers (one per pattern)
js/data.js          mock data
js/screens/*.js     Management Home, Needs Attention, More; Coach Home;
                    Parent Home; Visual system reference
docs/AUDIT.md       audit of the current Hub
docs/VISUAL-PASS-2.md  pass-2 visual direction and rules
docs/VISUAL-PASS-3.md  pass-3 changes: composition, spacing, surfaces, navigation
docs/screenshots/   pass-1, pass-2 and pass-3 renders (phone, desktop, dark)
```

## First pass: what was built

The five representative screens asked for (the rest of the tabs show a
"Not in this first pass" placeholder):

1. **Management Home** (`#mgmt-home`): a Needs Attention summary with the top
   three items, today's sessions with staffing status, approvals waiting,
   and tomorrow.
2. **Management More** (`#mgmt-more`): profile and a switch to Coach view,
   then Areas, Approvals, Settings and Account, grouped.
3. **Needs Attention** (`#mgmt-attention`), the detailed screen: severity
   summary, category filters, and cases grouped Urgent, Warning, To do. Each
   case opens a drawer with its details and its one action.
4. **Coach Home** (`#coach-home`): Next Session, today's sessions, shortcuts,
   and later this week.
5. **Parent Home** (`#parent-home`): greeting, child switcher, office update,
   Next Session, recent feedback, and family.

See `docs/AUDIT.md` for the audit and the reasoning behind the direction.
