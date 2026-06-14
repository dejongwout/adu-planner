// ── Regrid API (property lines) ───────────────────────────────────────────────
// Refresh at regrid.com if expired.
const REGRID_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJyZWdyaWQuY29tIiwiaWF0IjoxNzgxMzQwMzk5LCJleHAiOjE3ODM5MzIzOTksInUiOjgxNDE2MiwiZyI6MjMxNTMsImNhcCI6InBhOnRzOnBzOmJmOm1hOnR5OmVvOnpvOnNiIn0.NK7danMVK96MERTJ_uM7__1nkKljppfcl-rH6zoJJEo';

// ── ADU Models ────────────────────────────────────────────────────────────────
// width × depth = total footprint in feet.
// living = interior sq ft (shown in card + used for rental estimate).
// imageUrl = top-down floor plan (optional).
const ADU_MODELS = [
  {
    id:     's-studio',
    name:   'S Studio',
    width:  16,
    depth:  18,
    living: 250,
  },
  {
    id:     's-1bed',
    name:   'S One Bedroom',
    width:  18,
    depth:  22,
    living: 340,
  },
  {
    id:     's-1bed-plus',
    name:   'S One Bedroom+',
    width:  20,
    depth:  24,
    living: 420,
  },
  {
    id:     'm-1bed',
    name:   'M One Bedroom',
    width:  20,
    depth:  28,
    living: 490,
  },
  {
    id:     'm-1bed-plus',
    name:   'M One Bedroom+',
    width:  22,
    depth:  30,
    living: 580,
  },
  {
    id:     'l-1bed',
    name:   'L One Bedroom',
    width:  24,
    depth:  32,
    living: 680,
  },
  {
    id:     'l-2bed',
    name:   'L Two Bedroom',
    width:  28,
    depth:  36,
    living: 900,
  },
];
