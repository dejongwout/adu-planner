// ── Regrid API (property lines) ───────────────────────────────────────────────
// Refresh at regrid.com if expired.
const REGRID_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJyZWdyaWQuY29tIiwiaWF0IjoxNzgxMzQwMzk5LCJleHAiOjE3ODM5MzIzOTksInUiOjgxNDE2MiwiZyI6MjMxNTMsImNhcCI6InBhOnRzOnBzOmJmOm1hOnR5OmVvOnpvOnNiIn0.NK7danMVK96MERTJ_uM7__1nkKljppfcl-rH6zoJJEo';

// ── ADU Models ────────────────────────────────────────────────────────────────
// Sq ft from masayahomes.com. Width × depth estimated to match total sq ft.
// living = interior sq ft (used for rental estimate).
// imageUrl = top-down floor plan (optional).
const ADU_MODELS = [
  {
    id:       's-studio',
    name:     'S Studio',
    width:    15,
    depth:    20,
    living:   300,
    imageUrl: 'https://framerusercontent.com/images/AwLmr6xFst4p8ceSnR3JoGeP4Ng.webp',
  },
  {
    id:     's-1bed',
    name:   'S One Bedroom',
    width:  16,
    depth:  25,
    living: 400,
  },
  {
    id:     's-1bed-plus',
    name:   'S One Bedroom+',
    width:  20,
    depth:  25,
    living: 500,
  },
  {
    id:     'm-1bed',
    name:   'M One Bedroom',
    width:  20,
    depth:  30,
    living: 600,
  },
  {
    id:     'm-2bed',
    name:   'M Two Bedroom',
    width:  25,
    depth:  32,
    living: 800,
  },
  {
    id:     'l-2bed',
    name:   'L Two Bedroom',
    width:  30,
    depth:  40,
    living: 1200,
  },
];
