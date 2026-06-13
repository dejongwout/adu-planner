// ── Regrid API (property lines) ───────────────────────────────────────────────
// Refresh at regrid.com if expired.
const REGRID_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJyZWdyaWQuY29tIiwiaWF0IjoxNzgxMzQwMzk5LCJleHAiOjE3ODM5MzIzOTksInUiOjgxNDE2MiwiZyI6MjMxNTMsImNhcCI6InBhOnRzOnBzOmJmOm1hOnR5OmVvOnpvOnNiIn0.NK7danMVK96MERTJ_uM7__1nkKljppfcl-rH6zoJJEo';

// ── ADU Models ────────────────────────────────────────────────────────────────
// width × depth = total footprint in feet.
// living = interior sq ft (optional, shown in the sidebar card).
// imageUrl = top-down floor plan image (optional; falls back to blue rectangle).
const ADU_MODELS = [
  {
    id:       'studio-300',
    name:     'Studio 300',
    width:    25,   // long dimension (ft)
    depth:    16,   // short dimension: 12 ft living + 4 ft deck
    living:   300,
    imageUrl: 'https://framerusercontent.com/images/AwLmr6xFst4p8ceSnR3JoGeP4Ng.webp',
  },
  { id: '1bed-600',   name: '1 Bed 600',  width: 20, depth: 30 },
  { id: '2bed-800',   name: '2 Bed 800',  width: 25, depth: 32 },
  { id: '2bed-1000',  name: '2 Bed 1000', width: 28, depth: 36 },
];
