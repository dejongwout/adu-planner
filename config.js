// ── Regrid API (property lines) ───────────────────────────────────────────────
const REGRID_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJyZWdyaWQuY29tIiwiaWF0IjoxNzgxMzQwMzk5LCJleHAiOjE3ODM5MzIzOTksInUiOjgxNDE2MiwiZyI6MjMxNTMsImNhcCI6InBhOnRzOnBzOmJmOm1hOnR5OmVvOnpvOnNiIn0.NK7danMVK96MERTJ_uM7__1nkKljppfcl-rH6zoJJEo';

// ── ADU Models ────────────────────────────────────────────────────────────────
// Sq ft from masayahomes.com. Width × depth estimated to match total sq ft.
const ADU_MODELS = [
  {
    id:       's-studio',
    name:     'S Studio',
    width:    15,
    depth:    20,
    living:   300,
    url:      'https://masayahomes.com/adu/s-studio',
    imageUrl: 'https://framerusercontent.com/images/AwLmr6xFst4p8ceSnR3JoGeP4Ng.webp',
  },
  {
    id:     's-1bed',
    name:   'S One Bedroom',
    width:  16,
    depth:  25,
    living: 400,
    url:    'https://masayahomes.com/adu/s-onebedroom',
  },
  {
    id:     's-1bed-plus',
    name:   'S One Bedroom+',
    width:  20,
    depth:  25,
    living: 500,
    url:    'https://masayahomes.com/adu/s-onebedroom-plus',
  },
  {
    id:     'm-1bed',
    name:   'M One Bedroom',
    width:  20,
    depth:  30,
    living: 600,
    url:    'https://masayahomes.com/adu/m-onebedroom',
  },
  {
    id:     'm-2bed',
    name:   'M Two Bedroom',
    width:  25,
    depth:  32,
    living: 800,
    url:    'https://masayahomes.com/adu/m-twobedroom',
  },
  {
    id:     'l-2bed',
    name:   'L Two Bedroom',
    width:  30,
    depth:  40,
    living: 1200,
    url:    'https://masayahomes.com/homes/l-twobedroom',
  },
];
