// ── California region → county → city hierarchy ───────────────────────────────
const CA_REGIONS = [
  {
    id: 'bay-area', name: 'Bay Area',
    counties: [
      { name: 'San Francisco', cities: [
        { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
      ]},
      { name: 'Marin', cities: [
        { name: 'San Rafael',  lat: 37.9735, lng: -122.5311 },
        { name: 'Novato',      lat: 38.1074, lng: -122.5697 },
        { name: 'Mill Valley', lat: 37.9060, lng: -122.5447 },
        { name: 'Sausalito',   lat: 37.8590, lng: -122.4852 },
      ]},
      { name: 'San Mateo', cities: [
        { name: 'Daly City',         lat: 37.6879, lng: -122.4702 },
        { name: 'San Mateo',         lat: 37.5630, lng: -122.3255 },
        { name: 'Redwood City',      lat: 37.4848, lng: -122.2281 },
        { name: 'Burlingame',        lat: 37.5841, lng: -122.3659 },
        { name: 'South San Francisco', lat: 37.6547, lng: -122.4077 },
      ]},
      { name: 'Santa Clara', cities: [
        { name: 'San Jose',      lat: 37.3382, lng: -121.8863 },
        { name: 'Sunnyvale',     lat: 37.3688, lng: -122.0363 },
        { name: 'Santa Clara',   lat: 37.3541, lng: -121.9552 },
        { name: 'Mountain View', lat: 37.3861, lng: -122.0839 },
        { name: 'Palo Alto',     lat: 37.4419, lng: -122.1430 },
        { name: 'Cupertino',     lat: 37.3230, lng: -122.0322 },
        { name: 'Milpitas',      lat: 37.4323, lng: -121.8996 },
      ]},
      { name: 'Alameda', cities: [
        { name: 'Oakland',     lat: 37.8044, lng: -122.2712 },
        { name: 'Berkeley',    lat: 37.8716, lng: -122.2727 },
        { name: 'Fremont',     lat: 37.5485, lng: -121.9886 },
        { name: 'Hayward',     lat: 37.6688, lng: -122.0808 },
        { name: 'San Leandro', lat: 37.7249, lng: -122.1561 },
        { name: 'Livermore',   lat: 37.6819, lng: -121.7681 },
        { name: 'Alameda',     lat: 37.7652, lng: -122.2416 },
      ]},
      { name: 'Contra Costa', cities: [
        { name: 'Concord',      lat: 37.9780, lng: -122.0311 },
        { name: 'Richmond',     lat: 37.9358, lng: -122.3478 },
        { name: 'Walnut Creek', lat: 37.9101, lng: -122.0652 },
        { name: 'Antioch',      lat: 37.9963, lng: -121.8058 },
        { name: 'Brentwood',    lat: 37.9318, lng: -121.6957 },
      ]},
      { name: 'Napa', cities: [
        { name: 'Napa',             lat: 38.2975, lng: -122.2869 },
        { name: 'St. Helena',       lat: 38.5057, lng: -122.4697 },
        { name: 'American Canyon',  lat: 38.1796, lng: -122.2594 },
        { name: 'Calistoga',        lat: 38.5788, lng: -122.5797 },
      ]},
      { name: 'Sonoma', cities: [
        { name: 'Santa Rosa',   lat: 38.4404, lng: -122.7141 },
        { name: 'Petaluma',     lat: 38.2324, lng: -122.6367 },
        { name: 'Rohnert Park', lat: 38.3396, lng: -122.7011 },
        { name: 'Windsor',      lat: 38.5474, lng: -122.8150 },
        { name: 'Healdsburg',   lat: 38.6107, lng: -122.8697 },
      ]},
      { name: 'Solano', cities: [
        { name: 'Vallejo',   lat: 38.1041, lng: -122.2566 },
        { name: 'Fairfield', lat: 38.2494, lng: -122.0400 },
        { name: 'Vacaville', lat: 38.3566, lng: -121.9877 },
        { name: 'Benicia',   lat: 38.0491, lng: -122.1597 },
      ]},
    ],
  },
  {
    id: 'socal', name: 'Southern California',
    counties: [
      { name: 'Los Angeles', cities: [
        { name: 'Los Angeles',  lat: 34.0522, lng: -118.2437 },
        { name: 'Long Beach',   lat: 33.7701, lng: -118.1937 },
        { name: 'Pasadena',     lat: 34.1478, lng: -118.1445 },
        { name: 'Glendale',     lat: 34.1425, lng: -118.2551 },
        { name: 'Santa Monica', lat: 34.0195, lng: -118.4912 },
        { name: 'Burbank',      lat: 34.1808, lng: -118.3090 },
        { name: 'Torrance',     lat: 33.8358, lng: -118.3406 },
        { name: 'Inglewood',    lat: 33.9617, lng: -118.3531 },
        { name: 'Pomona',       lat: 34.0553, lng: -117.7500 },
      ]},
      { name: 'Orange', cities: [
        { name: 'Anaheim',          lat: 33.8353, lng: -117.9145 },
        { name: 'Santa Ana',        lat: 33.7456, lng: -117.8678 },
        { name: 'Irvine',           lat: 33.6846, lng: -117.8265 },
        { name: 'Huntington Beach', lat: 33.6603, lng: -117.9992 },
        { name: 'Garden Grove',     lat: 33.7739, lng: -117.9415 },
        { name: 'Newport Beach',    lat: 33.6189, lng: -117.9289 },
        { name: 'Fullerton',        lat: 33.8704, lng: -117.9242 },
      ]},
      { name: 'Ventura', cities: [
        { name: 'Oxnard',         lat: 34.1975, lng: -119.1771 },
        { name: 'Thousand Oaks',  lat: 34.1706, lng: -118.8376 },
        { name: 'Simi Valley',    lat: 34.2694, lng: -118.7815 },
        { name: 'Ventura',        lat: 34.2805, lng: -119.2945 },
        { name: 'Camarillo',      lat: 34.2164, lng: -119.0376 },
      ]},
      { name: 'San Bernardino', cities: [
        { name: 'San Bernardino',    lat: 34.1083, lng: -117.2898 },
        { name: 'Fontana',           lat: 34.0922, lng: -117.4350 },
        { name: 'Ontario',           lat: 34.0633, lng: -117.6509 },
        { name: 'Rancho Cucamonga',  lat: 34.1064, lng: -117.5931 },
        { name: 'Victorville',       lat: 34.5362, lng: -117.2928 },
        { name: 'Upland',            lat: 34.0975, lng: -117.6484 },
      ]},
      { name: 'Riverside', cities: [
        { name: 'Riverside',    lat: 33.9806, lng: -117.3755 },
        { name: 'Moreno Valley', lat: 33.9425, lng: -117.2297 },
        { name: 'Corona',       lat: 33.8753, lng: -117.5664 },
        { name: 'Temecula',     lat: 33.4936, lng: -117.1484 },
        { name: 'Murrieta',     lat: 33.5539, lng: -117.2139 },
        { name: 'Palm Springs', lat: 33.8303, lng: -116.5453 },
      ]},
    ],
  },
  {
    id: 'san-diego', name: 'San Diego',
    counties: [
      { name: 'San Diego', cities: [
        { name: 'San Diego',  lat: 32.7157, lng: -117.1611 },
        { name: 'Chula Vista', lat: 32.6401, lng: -117.0842 },
        { name: 'Oceanside',  lat: 33.1959, lng: -117.3795 },
        { name: 'Escondido',  lat: 33.1192, lng: -117.0864 },
        { name: 'El Cajon',   lat: 32.7948, lng: -116.9625 },
        { name: 'Carlsbad',   lat: 33.1581, lng: -117.3506 },
        { name: 'Encinitas',  lat: 33.0369, lng: -117.2920 },
        { name: 'La Mesa',    lat: 32.7678, lng: -117.0231 },
      ]},
    ],
  },
  {
    id: 'central-coast', name: 'Central Coast',
    counties: [
      { name: 'Santa Cruz', cities: [
        { name: 'Santa Cruz',   lat: 36.9741, lng: -122.0308 },
        { name: 'Watsonville',  lat: 36.9102, lng: -121.7569 },
        { name: 'Capitola',     lat: 36.9747, lng: -121.9522 },
        { name: 'Scotts Valley', lat: 37.0505, lng: -122.0147 },
      ]},
      { name: 'Monterey', cities: [
        { name: 'Monterey',     lat: 36.6002, lng: -121.8947 },
        { name: 'Salinas',      lat: 36.6777, lng: -121.6555 },
        { name: 'Pacific Grove', lat: 36.6177, lng: -121.9166 },
        { name: 'Carmel',       lat: 36.5552, lng: -121.9233 },
        { name: 'Seaside',      lat: 36.6116, lng: -121.8525 },
      ]},
      { name: 'San Luis Obispo', cities: [
        { name: 'San Luis Obispo', lat: 35.2828, lng: -120.6596 },
        { name: 'Paso Robles',     lat: 35.6369, lng: -120.6908 },
        { name: 'Arroyo Grande',   lat: 35.1186, lng: -120.5904 },
        { name: 'Pismo Beach',     lat: 35.1428, lng: -120.6413 },
        { name: 'Atascadero',      lat: 35.4894, lng: -120.6707 },
      ]},
      { name: 'Santa Barbara', cities: [
        { name: 'Santa Barbara', lat: 34.4208, lng: -119.6982 },
        { name: 'Santa Maria',   lat: 34.9530, lng: -120.4357 },
        { name: 'Lompoc',        lat: 34.6391, lng: -120.4579 },
        { name: 'Goleta',        lat: 34.4358, lng: -119.8276 },
        { name: 'Carpinteria',   lat: 34.3989, lng: -119.5187 },
      ]},
    ],
  },
  {
    id: 'sacramento', name: 'Sacramento Region',
    counties: [
      { name: 'Sacramento', cities: [
        { name: 'Sacramento',     lat: 38.5816, lng: -121.4944 },
        { name: 'Elk Grove',      lat: 38.4088, lng: -121.3716 },
        { name: 'Folsom',         lat: 38.6780, lng: -121.1761 },
        { name: 'Citrus Heights', lat: 38.7073, lng: -121.2810 },
        { name: 'Rancho Cordova', lat: 38.5891, lng: -121.3027 },
      ]},
      { name: 'Placer', cities: [
        { name: 'Roseville', lat: 38.7521, lng: -121.2880 },
        { name: 'Rocklin',   lat: 38.7907, lng: -121.2358 },
        { name: 'Lincoln',   lat: 38.8916, lng: -121.2929 },
        { name: 'Auburn',    lat: 38.8966, lng: -121.0769 },
      ]},
      { name: 'El Dorado', cities: [
        { name: 'El Dorado Hills',  lat: 38.6796, lng: -121.0713 },
        { name: 'Placerville',      lat: 38.7296, lng: -120.7985 },
        { name: 'South Lake Tahoe', lat: 38.9399, lng: -119.9772 },
      ]},
      { name: 'Yolo', cities: [
        { name: 'Davis',            lat: 38.5449, lng: -121.7405 },
        { name: 'Woodland',         lat: 38.6785, lng: -121.7733 },
        { name: 'West Sacramento',  lat: 38.5805, lng: -121.5319 },
        { name: 'Winters',          lat: 38.5249, lng: -121.9727 },
      ]},
      { name: 'Nevada', cities: [
        { name: 'Grass Valley', lat: 39.2191, lng: -121.0602 },
        { name: 'Nevada City',  lat: 39.2613, lng: -121.0091 },
        { name: 'Truckee',      lat: 39.3280, lng: -120.1833 },
      ]},
    ],
  },
  {
    id: 'central-valley', name: 'Central Valley',
    counties: [
      { name: 'San Joaquin', cities: [
        { name: 'Stockton', lat: 37.9577, lng: -121.2908 },
        { name: 'Tracy',    lat: 37.7397, lng: -121.4252 },
        { name: 'Manteca',  lat: 37.7974, lng: -121.2163 },
        { name: 'Lodi',     lat: 38.1302, lng: -121.2724 },
      ]},
      { name: 'Stanislaus', cities: [
        { name: 'Modesto',  lat: 37.6391, lng: -120.9969 },
        { name: 'Turlock',  lat: 37.4947, lng: -120.8466 },
        { name: 'Ceres',    lat: 37.5949, lng: -120.9577 },
        { name: 'Oakdale',  lat: 37.7763, lng: -120.8474 },
      ]},
      { name: 'Fresno', cities: [
        { name: 'Fresno', lat: 36.7378, lng: -119.7871 },
        { name: 'Clovis', lat: 36.8252, lng: -119.7029 },
        { name: 'Selma',  lat: 36.5707, lng: -119.6121 },
      ]},
      { name: 'Kern', cities: [
        { name: 'Bakersfield', lat: 35.3733, lng: -119.0187 },
        { name: 'Delano',      lat: 35.7688, lng: -119.2468 },
        { name: 'Ridgecrest',  lat: 35.6225, lng: -117.6709 },
      ]},
      { name: 'Tulare', cities: [
        { name: 'Visalia',     lat: 36.3302, lng: -119.2921 },
        { name: 'Tulare',      lat: 36.2077, lng: -119.3473 },
        { name: 'Porterville', lat: 36.0652, lng: -119.0168 },
      ]},
      { name: 'Kings', cities: [
        { name: 'Hanford',  lat: 36.3275, lng: -119.6457 },
        { name: 'Lemoore',  lat: 36.2996, lng: -119.7829 },
        { name: 'Corcoran', lat: 36.0977, lng: -119.5607 },
      ]},
      { name: 'Merced', cities: [
        { name: 'Merced',    lat: 37.3022, lng: -120.4830 },
        { name: 'Atwater',   lat: 37.3474, lng: -120.6088 },
        { name: 'Los Banos', lat: 37.0577, lng: -120.8497 },
      ]},
    ],
  },
  {
    id: 'northern-ca', name: 'Northern California',
    counties: [
      { name: 'Humboldt', cities: [
        { name: 'Eureka',         lat: 40.8021, lng: -124.1637 },
        { name: 'Arcata',         lat: 40.8665, lng: -124.0828 },
        { name: 'Fortuna',        lat: 40.5982, lng: -124.1574 },
        { name: 'McKinleyville',  lat: 40.9479, lng: -124.0997 },
      ]},
      { name: 'Mendocino', cities: [
        { name: 'Ukiah',      lat: 39.1502, lng: -123.2077 },
        { name: 'Fort Bragg', lat: 39.4457, lng: -123.8053 },
        { name: 'Willits',    lat: 39.4099, lng: -123.3533 },
        { name: 'Mendocino',  lat: 39.3071, lng: -123.7994 },
      ]},
      { name: 'Lake', cities: [
        { name: 'Lakeport',    lat: 39.0429, lng: -122.9158 },
        { name: 'Clearlake',   lat: 38.9582, lng: -122.6266 },
        { name: 'Kelseyville', lat: 38.9982, lng: -122.8374 },
      ]},
      { name: 'Shasta', cities: [
        { name: 'Redding',          lat: 40.5865, lng: -122.3917 },
        { name: 'Anderson',         lat: 40.4499, lng: -122.2977 },
        { name: 'Shasta Lake City', lat: 40.6805, lng: -122.3702 },
      ]},
    ],
  },
];

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
    imageUrl:      'https://framerusercontent.com/images/AwLmr6xFst4p8ceSnR3JoGeP4Ng.webp',
    imageRotation: Math.PI / 2,
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
