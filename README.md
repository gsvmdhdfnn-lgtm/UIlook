# Relvor UI

A visual-design prototype for Relvor, the operations platform (Josh Evans is
one example organisation using it). It is a static, mock-data front end for
trying out the look and feel. It is not a second Hub.

- **Josh Evans brand = live Hub design:** `docs/JOSH-EVANS-THEME.md`, `docs/screenshots/joshevans/`. Switch Brand to Josh Evans in the prototype bar.
- **Screen priority (one screen, one obvious purpose):** `docs/SCREEN-PRIORITY.md`, `docs/screenshots/pass-12/priority/`.
- **Flow simplification (all roles) and navigation motion:** `docs/FLOW-SIMPLIFICATION.md`, `docs/screenshots/pass-12/flow/`.
- **Management simplification (four areas on Home):** `docs/MANAGEMENT-IA.md`, `docs/screenshots/pass-12/management-ia/`.
- **Pass 12 follow-up, plain language and browse-first public site:** `docs/LANGUAGE-AUDIT.md`, `docs/screenshots/pass-12/journey/`.
- **Pass 12, the whole Hub, clickable (current):** `docs/VISUAL-PASS-12.md`, `docs/FEATURE-COVERAGE.md`, `docs/screenshots/pass-12/`. Every Management, Coach, Parent and Public screen, five guided walkthroughs, finance access and feature switches.
- **Pass 11, hierarchy and focus:** `docs/VISUAL-PASS-11.md`, `docs/screenshots/pass-11/`.
- **Pass 10, Relvor brand system:** `docs/VISUAL-PASS-10.md`, `docs/screenshots/pass-10/`. Inter, obsidian/porcelain/amber, compact proportions, working-panel Home.
- **Pass 9, design-pack layout:** `docs/VISUAL-PASS-9.md`, `docs/screenshots/pass-9/`. Home and More navigation, pack page structures, Relvor finish.
- **Palette experiment:** `docs/PALETTE-EXPERIMENT.md`. Slate (Management), Forest (Coach), Plum (Parent); switch in the prototype bar.
- **Pass 8, Home style everywhere:** `docs/VISUAL-PASS-8.md`, `docs/screenshots/pass-8/`. Bold sans headings and tabs; porcelain canvas, soft cards and obsidian shell across Management, Staff and Client.
- **Pass 7, reference Management Home:** branch `claude/visual-pass-7`; `docs/VISUAL-PASS-7.md`, `docs/screenshots/pass-7/`. Floating obsidian sidebar on porcelain; greeting, soft summary cards, primary surfaces, quiet rail, feature panels.
- **Pass 6, Atelier:** branch `claude/visual-pass-6`; `docs/VISUAL-PASS-6.md`, `docs/screenshots/pass-6/`. Obsidian spine, glide rail, editorial serif, glass and motion.
- **Pass 5, product identity:** `docs/VISUAL-PASS-5.md`, `docs/screenshots/pass-5/`. The Brief, the Day Line, state marks and decisions, index tabs.
- **Pass 4, section navigation:** `docs/VISUAL-PASS-4.md`, `docs/screenshots/pass-4/`.
- **Visual pass 3:** `docs/VISUAL-PASS-3.md`, `docs/screenshots/pass-3/`.
- **Visual pass 2:** branch `claude/visual-pass-2`; `docs/VISUAL-PASS-2.md`, `docs/screenshots/pass-2/`.
- **Visual pass 1:** branch `claude/visual-pass-1`, screenshots in `docs/screenshots/pass-1/`.

- The real product lives in `gsvmdhdfnn-lgtm/Coach-allocation-TEST`. This repo
  never changes it.
- All data is invented for UI/UX testing: people, venues, sessions, figures and
  organisations are fictional and do not describe any real records.
- There is no backend or sign-in service here. Every change stays in memory
  and resets on reload. Mock data lives in `js/data/*.js` and screens read it
  only through small `Hub.db` helpers, using product concepts (Coach, Session,
  Occurrence, Player, Parent, Invoice), not storage field names.

## Run it

No build step. Serve the folder and open `index.html`:

```bash
python3 -m http.server 8000
# then http://localhost:8000/
```

The dark bar at the top is prototype chrome. Use it to switch:
- **Role:** Management, Staff, Client or Public (called Coach and Parent under the Josh Evans brand)
- **Coach role:** Lead, Coach or Learning coach (when Role is Staff)
- **Finance access:** None, View (read-only) or Manage
- **Feature switches** and **Scenario** (guided walkthroughs)
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
css/layout.css      pass 9: design-pack page structures (heroes, area cards, issue cards, directory, tiles)
css/palettes.css    palette experiment
css/joshevans.css   Josh Evans brand, following the live Hub's UI (Coach-allocation-TEST, read only): Slate, Forest and Plum schemes
js/brand.js         branding boundary (name, mark, accent, terms; accent clamped for contrast)
js/icons.js         stroke icon set
js/ui.js            component helpers (one per pattern)
js/kit.js           pass 12 kit: routes, money, dates, audit, layout, forms, states
css/kit.css         kit styles; css/areas/*.css per-area styles
js/data/*.js        mock data and Hub.db helpers per area (core, people, schedule,
                    finance, families, coaching, development, public, parent-hub,
                    coach-hub) and the Needs Attention engine (attention.js)
js/screens/*.js     one file per area: management, finance, schedule, players,
                    coaches, coach, parent, public, settings, scenarios, system
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
