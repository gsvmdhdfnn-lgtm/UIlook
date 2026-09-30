# Palette experiment

This tests three colour schemes on the same design. By default each area
gets its own palette so they can be compared side by side:

| Area | Palette | Mood |
|---|---|---|
| Management | **Slate & Ice**: navy-slate shell, cool mist canvas, steel-blue accent | cool, precise, automotive |
| Coach (Staff) | **Forest & Brass**: deep green shell, ivory canvas, brass accent | hospitality, grounded, club-house |
| Parent (Client) | **Plum & Terracotta**: aubergine shell, soft rose-sand canvas, terracotta accent | warm, welcoming, family |

The **Palette** control in the prototype bar switches between:
- **By area** (the default above);
- **Original** (pass 8's porcelain, obsidian and bronze);
- any one palette applied to every area.

**What a palette changes:**
- the sidebar and top bar colour;
- the active nav and tab highlight;
- the organisation mark;
- the canvas, card and rail tones;
- the ridgeline;
- the platform accent.

**What stays fixed:**
- The status colours (green, orange, red) never change.
- Under the Josh Evans brand, the organisation's own accent (blue) stays.
  Only the shell and canvas follow the palette.

**Where the palettes live:**
- The palettes are in `css/palettes.css`.
- Shell colours are variables in `css/home.css` (`--shell-*`, `--tab-bar`),
  so a chosen palette is a single block to keep.
- Screenshots are in `docs/screenshots/palettes/`.
