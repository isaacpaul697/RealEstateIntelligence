import type { CityConfig } from "./types";

/**
 * Registry of supported cities with live open-data permit endpoints.
 * Every dataset here was verified to respond over the Socrata SODA API.
 * Add a city by appending its { domain, dataset } 4x4 and a normalizer
 * entry in live/permits.ts. Cities without a portal fall back to BPS + OSM.
 */
export const CITIES: CityConfig[] = [
  {
    id: "austin",
    name: "Austin",
    state: "TX",
    lat: 30.2672,
    lng: -97.7431,
    zoom: 11,
    socrata: { domain: "data.austintexas.gov", dataset: "3syk-w9eu" },
  },
  {
    id: "chicago",
    name: "Chicago",
    state: "IL",
    lat: 41.8781,
    lng: -87.6298,
    zoom: 11,
    socrata: { domain: "data.cityofchicago.org", dataset: "ydr8-5enu" },
  },
  {
    id: "nyc",
    name: "New York City",
    state: "NY",
    lat: 40.7128,
    lng: -74.006,
    zoom: 11,
    socrata: { domain: "data.cityofnewyork.us", dataset: "ipu4-2q9a" },
  },
  {
    id: "seattle",
    name: "Seattle",
    state: "WA",
    lat: 47.6062,
    lng: -122.3321,
    zoom: 11,
    socrata: { domain: "data.seattle.gov", dataset: "76t5-zqzr" },
  },
  {
    id: "sf",
    name: "San Francisco",
    state: "CA",
    lat: 37.7749,
    lng: -122.4194,
    zoom: 12,
    socrata: { domain: "data.sfgov.org", dataset: "i98e-djp9" },
  },
  {
    id: "la",
    name: "Los Angeles",
    state: "CA",
    lat: 34.0522,
    lng: -118.2437,
    zoom: 11,
    socrata: { domain: "data.lacity.org", dataset: "pi9x-tg5x" },
  },
  {
    id: "neworleans",
    name: "New Orleans",
    state: "LA",
    lat: 29.9511,
    lng: -90.0715,
    zoom: 12,
    socrata: { domain: "data.nola.gov", dataset: "nbcf-m6c2" },
  },

  /* ---------------------------------------------------------------- */
  /*  OSM-mapped cities (no public permit portal). Each gets the same  */
  /*  Austin-style map + modeled economics from OpenStreetMap data.    */
  /* ---------------------------------------------------------------- */
  { id: "houston", name: "Houston", state: "TX", lat: 29.7604, lng: -95.3698, zoom: 11 },
  { id: "phoenix", name: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074, zoom: 11 },
  { id: "philadelphia", name: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652, zoom: 12 },
  { id: "sanantonio", name: "San Antonio", state: "TX", lat: 29.4241, lng: -98.4936, zoom: 11 },
  { id: "sandiego", name: "San Diego", state: "CA", lat: 32.7157, lng: -117.1611, zoom: 11 },
  { id: "dallas", name: "Dallas", state: "TX", lat: 32.7767, lng: -96.797, zoom: 11 },
  { id: "sanjose", name: "San Jose", state: "CA", lat: 37.3382, lng: -121.8863, zoom: 11 },
  { id: "jacksonville", name: "Jacksonville", state: "FL", lat: 30.3322, lng: -81.6557, zoom: 11 },
  { id: "fortworth", name: "Fort Worth", state: "TX", lat: 32.7555, lng: -97.3308, zoom: 11 },
  { id: "columbus", name: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988, zoom: 11 },
  { id: "charlotte", name: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431, zoom: 11 },
  { id: "indianapolis", name: "Indianapolis", state: "IN", lat: 39.7684, lng: -86.1581, zoom: 11 },
  { id: "denver", name: "Denver", state: "CO", lat: 39.7392, lng: -104.9903, zoom: 11 },
  { id: "washington", name: "Washington", state: "DC", lat: 38.9072, lng: -77.0369, zoom: 12 },
  { id: "boston", name: "Boston", state: "MA", lat: 42.3601, lng: -71.0589, zoom: 12 },
  { id: "nashville", name: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816, zoom: 11 },
  { id: "oklahomacity", name: "Oklahoma City", state: "OK", lat: 35.4676, lng: -97.5164, zoom: 11 },
  { id: "portland", name: "Portland", state: "OR", lat: 45.5152, lng: -122.6784, zoom: 11 },
  { id: "lasvegas", name: "Las Vegas", state: "NV", lat: 36.1699, lng: -115.1398, zoom: 11 },
  { id: "memphis", name: "Memphis", state: "TN", lat: 35.1495, lng: -90.049, zoom: 11 },
  { id: "louisville", name: "Louisville", state: "KY", lat: 38.2527, lng: -85.7585, zoom: 11 },
  { id: "baltimore", name: "Baltimore", state: "MD", lat: 39.2904, lng: -76.6122, zoom: 12 },
  { id: "milwaukee", name: "Milwaukee", state: "WI", lat: 43.0389, lng: -87.9065, zoom: 12 },
  { id: "albuquerque", name: "Albuquerque", state: "NM", lat: 35.0844, lng: -106.6504, zoom: 11 },
  { id: "tucson", name: "Tucson", state: "AZ", lat: 32.2226, lng: -110.9747, zoom: 11 },
  { id: "fresno", name: "Fresno", state: "CA", lat: 36.7378, lng: -119.7871, zoom: 11 },
  { id: "sacramento", name: "Sacramento", state: "CA", lat: 38.5816, lng: -121.4944, zoom: 11 },
  { id: "kansascity", name: "Kansas City", state: "MO", lat: 39.0997, lng: -94.5786, zoom: 11 },
  { id: "mesa", name: "Mesa", state: "AZ", lat: 33.4152, lng: -111.8315, zoom: 11 },
  { id: "atlanta", name: "Atlanta", state: "GA", lat: 33.749, lng: -84.388, zoom: 11 },
  { id: "omaha", name: "Omaha", state: "NE", lat: 41.2565, lng: -95.9345, zoom: 11 },
  { id: "coloradosprings", name: "Colorado Springs", state: "CO", lat: 38.8339, lng: -104.8214, zoom: 11 },
  { id: "raleigh", name: "Raleigh", state: "NC", lat: 35.7796, lng: -78.6382, zoom: 11 },
  { id: "miami", name: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, zoom: 12 },
  { id: "virginiabeach", name: "Virginia Beach", state: "VA", lat: 36.8529, lng: -75.978, zoom: 11 },
  { id: "minneapolis", name: "Minneapolis", state: "MN", lat: 44.9778, lng: -93.265, zoom: 12 },
  { id: "tampa", name: "Tampa", state: "FL", lat: 27.9506, lng: -82.4572, zoom: 11 },
  { id: "tulsa", name: "Tulsa", state: "OK", lat: 36.154, lng: -95.9928, zoom: 11 },
  { id: "arlington", name: "Arlington", state: "TX", lat: 32.7357, lng: -97.1081, zoom: 11 },
  { id: "wichita", name: "Wichita", state: "KS", lat: 37.6872, lng: -97.3301, zoom: 11 },
  { id: "cleveland", name: "Cleveland", state: "OH", lat: 41.4993, lng: -81.6944, zoom: 12 },
  { id: "bakersfield", name: "Bakersfield", state: "CA", lat: 35.3733, lng: -119.0187, zoom: 11 },
  { id: "aurora", name: "Aurora", state: "CO", lat: 39.7294, lng: -104.8319, zoom: 11 },
  { id: "anaheim", name: "Anaheim", state: "CA", lat: 33.8366, lng: -117.9143, zoom: 11 },
  { id: "honolulu", name: "Honolulu", state: "HI", lat: 21.3069, lng: -157.8583, zoom: 12 },
  { id: "pittsburgh", name: "Pittsburgh", state: "PA", lat: 40.4406, lng: -79.9959, zoom: 12 },
  { id: "cincinnati", name: "Cincinnati", state: "OH", lat: 39.1031, lng: -84.512, zoom: 12 },
  { id: "stlouis", name: "St. Louis", state: "MO", lat: 38.627, lng: -90.1994, zoom: 12 },
  { id: "orlando", name: "Orlando", state: "FL", lat: 28.5383, lng: -81.3792, zoom: 11 },
  { id: "detroit", name: "Detroit", state: "MI", lat: 42.3314, lng: -83.0458, zoom: 11 },

  /* ---------------------------------------------------------------- */
  /*  Suburbs — each is its OWN standalone OSM-mapped entry (not        */
  /*  grouped under the nearby big city). Same map + modeled economics. */
  /* ---------------------------------------------------------------- */
  // Austin, TX metro
  { id: "roundrock", name: "Round Rock", state: "TX", lat: 30.5083, lng: -97.6789, zoom: 12 },
  { id: "cedarpark", name: "Cedar Park", state: "TX", lat: 30.5052, lng: -97.8203, zoom: 12 },
  { id: "georgetowntx", name: "Georgetown", state: "TX", lat: 30.6333, lng: -97.6779, zoom: 12 },
  { id: "pflugerville", name: "Pflugerville", state: "TX", lat: 30.4394, lng: -97.62, zoom: 12 },
  { id: "sanmarcos", name: "San Marcos", state: "TX", lat: 29.8833, lng: -97.9414, zoom: 12 },
  // Dallas–Fort Worth, TX metro
  { id: "plano", name: "Plano", state: "TX", lat: 33.0198, lng: -96.6989, zoom: 12 },
  { id: "frisco", name: "Frisco", state: "TX", lat: 33.1507, lng: -96.8236, zoom: 12 },
  { id: "mckinney", name: "McKinney", state: "TX", lat: 33.1972, lng: -96.6398, zoom: 12 },
  { id: "irving", name: "Irving", state: "TX", lat: 32.814, lng: -96.9489, zoom: 12 },
  { id: "garland", name: "Garland", state: "TX", lat: 32.9126, lng: -96.6389, zoom: 12 },
  { id: "denton", name: "Denton", state: "TX", lat: 33.2148, lng: -97.1331, zoom: 12 },
  { id: "richardson", name: "Richardson", state: "TX", lat: 32.9483, lng: -96.7299, zoom: 12 },
  { id: "carrollton", name: "Carrollton", state: "TX", lat: 32.9756, lng: -96.89, zoom: 12 },
  { id: "grandprairie", name: "Grand Prairie", state: "TX", lat: 32.7459, lng: -96.9978, zoom: 12 },
  // Houston, TX metro
  { id: "sugarland", name: "Sugar Land", state: "TX", lat: 29.6197, lng: -95.6349, zoom: 12 },
  { id: "thewoodlands", name: "The Woodlands", state: "TX", lat: 30.1658, lng: -95.4613, zoom: 12 },
  { id: "pearland", name: "Pearland", state: "TX", lat: 29.5636, lng: -95.286, zoom: 12 },
  { id: "pasadenatx", name: "Pasadena", state: "TX", lat: 29.6911, lng: -95.2091, zoom: 12 },
  { id: "katy", name: "Katy", state: "TX", lat: 29.7858, lng: -95.8245, zoom: 12 },
  { id: "leaguecity", name: "League City", state: "TX", lat: 29.5075, lng: -95.0949, zoom: 12 },
  // San Antonio, TX metro
  { id: "newbraunfels", name: "New Braunfels", state: "TX", lat: 29.703, lng: -98.1245, zoom: 12 },
  // Phoenix, AZ metro
  { id: "scottsdale", name: "Scottsdale", state: "AZ", lat: 33.4942, lng: -111.9261, zoom: 12 },
  { id: "tempe", name: "Tempe", state: "AZ", lat: 33.4255, lng: -111.94, zoom: 12 },
  { id: "chandler", name: "Chandler", state: "AZ", lat: 33.3062, lng: -111.8413, zoom: 12 },
  { id: "gilbert", name: "Gilbert", state: "AZ", lat: 33.3528, lng: -111.789, zoom: 12 },
  { id: "glendaleaz", name: "Glendale", state: "AZ", lat: 33.5387, lng: -112.186, zoom: 12 },
  { id: "peoriaaz", name: "Peoria", state: "AZ", lat: 33.5806, lng: -112.2374, zoom: 12 },
  // Los Angeles, CA metro
  { id: "longbeach", name: "Long Beach", state: "CA", lat: 33.7701, lng: -118.1937, zoom: 12 },
  { id: "glendaleca", name: "Glendale", state: "CA", lat: 34.1425, lng: -118.2551, zoom: 12 },
  { id: "pasadenaca", name: "Pasadena", state: "CA", lat: 34.1478, lng: -118.1445, zoom: 12 },
  { id: "santamonica", name: "Santa Monica", state: "CA", lat: 34.0195, lng: -118.4912, zoom: 13 },
  { id: "burbank", name: "Burbank", state: "CA", lat: 34.1808, lng: -118.309, zoom: 12 },
  { id: "torrance", name: "Torrance", state: "CA", lat: 33.8358, lng: -118.3406, zoom: 12 },
  { id: "santaclarita", name: "Santa Clarita", state: "CA", lat: 34.3917, lng: -118.5426, zoom: 12 },
  // San Diego, CA metro
  { id: "chulavista", name: "Chula Vista", state: "CA", lat: 32.6401, lng: -117.0842, zoom: 12 },
  { id: "oceanside", name: "Oceanside", state: "CA", lat: 33.1959, lng: -117.3795, zoom: 12 },
  { id: "escondido", name: "Escondido", state: "CA", lat: 33.1192, lng: -117.0864, zoom: 12 },
  { id: "carlsbad", name: "Carlsbad", state: "CA", lat: 33.1581, lng: -117.3506, zoom: 12 },
  // San Francisco Bay Area, CA
  { id: "oakland", name: "Oakland", state: "CA", lat: 37.8044, lng: -122.2712, zoom: 12 },
  { id: "berkeley", name: "Berkeley", state: "CA", lat: 37.8715, lng: -122.273, zoom: 13 },
  { id: "fremont", name: "Fremont", state: "CA", lat: 37.5485, lng: -121.9886, zoom: 12 },
  { id: "sunnyvale", name: "Sunnyvale", state: "CA", lat: 37.3688, lng: -122.0363, zoom: 12 },
  { id: "santaclara", name: "Santa Clara", state: "CA", lat: 37.3541, lng: -121.9552, zoom: 12 },
  { id: "mountainview", name: "Mountain View", state: "CA", lat: 37.3861, lng: -122.0839, zoom: 13 },
  { id: "paloalto", name: "Palo Alto", state: "CA", lat: 37.4419, lng: -122.143, zoom: 13 },
  // Sacramento, CA metro
  { id: "elkgrove", name: "Elk Grove", state: "CA", lat: 38.4088, lng: -121.3716, zoom: 12 },
  { id: "roseville", name: "Roseville", state: "CA", lat: 38.7521, lng: -121.288, zoom: 12 },
  // Denver, CO metro
  { id: "lakewoodco", name: "Lakewood", state: "CO", lat: 39.7047, lng: -105.0814, zoom: 12 },
  { id: "arvada", name: "Arvada", state: "CO", lat: 39.8028, lng: -105.0875, zoom: 12 },
  { id: "westminsterco", name: "Westminster", state: "CO", lat: 39.8367, lng: -105.0372, zoom: 12 },
  { id: "thornton", name: "Thornton", state: "CO", lat: 39.868, lng: -104.9719, zoom: 12 },
  { id: "boulder", name: "Boulder", state: "CO", lat: 40.015, lng: -105.2705, zoom: 12 },
  { id: "littleton", name: "Littleton", state: "CO", lat: 39.6133, lng: -105.0166, zoom: 12 },
  // Seattle, WA metro
  { id: "bellevue", name: "Bellevue", state: "WA", lat: 47.6101, lng: -122.2015, zoom: 12 },
  { id: "tacoma", name: "Tacoma", state: "WA", lat: 47.2529, lng: -122.4443, zoom: 12 },
  { id: "kent", name: "Kent", state: "WA", lat: 47.3809, lng: -122.2348, zoom: 12 },
  { id: "renton", name: "Renton", state: "WA", lat: 47.4829, lng: -122.2171, zoom: 12 },
  { id: "everett", name: "Everett", state: "WA", lat: 47.979, lng: -122.2021, zoom: 12 },
  { id: "redmond", name: "Redmond", state: "WA", lat: 47.674, lng: -122.1215, zoom: 12 },
  // Portland, OR metro
  { id: "beaverton", name: "Beaverton", state: "OR", lat: 45.4871, lng: -122.8037, zoom: 12 },
  { id: "gresham", name: "Gresham", state: "OR", lat: 45.5001, lng: -122.4302, zoom: 12 },
  { id: "hillsboro", name: "Hillsboro", state: "OR", lat: 45.5229, lng: -122.9898, zoom: 12 },
  // Miami, FL metro
  { id: "hialeah", name: "Hialeah", state: "FL", lat: 25.8576, lng: -80.2781, zoom: 12 },
  { id: "fortlauderdale", name: "Fort Lauderdale", state: "FL", lat: 26.1224, lng: -80.1373, zoom: 12 },
  { id: "hollywoodfl", name: "Hollywood", state: "FL", lat: 26.0112, lng: -80.1495, zoom: 12 },
  { id: "miamibeach", name: "Miami Beach", state: "FL", lat: 25.7907, lng: -80.13, zoom: 13 },
  // Tampa, FL metro
  { id: "stpetersburg", name: "St. Petersburg", state: "FL", lat: 27.7676, lng: -82.6403, zoom: 12 },
  { id: "clearwater", name: "Clearwater", state: "FL", lat: 27.9659, lng: -82.8001, zoom: 12 },
  // Orlando, FL metro
  { id: "kissimmee", name: "Kissimmee", state: "FL", lat: 28.292, lng: -81.4076, zoom: 12 },
  // Atlanta, GA metro
  { id: "sandysprings", name: "Sandy Springs", state: "GA", lat: 33.9304, lng: -84.3733, zoom: 12 },
  { id: "roswell", name: "Roswell", state: "GA", lat: 34.0232, lng: -84.3616, zoom: 12 },
  { id: "marietta", name: "Marietta", state: "GA", lat: 33.9526, lng: -84.5499, zoom: 12 },
  { id: "alpharetta", name: "Alpharetta", state: "GA", lat: 34.0754, lng: -84.2941, zoom: 12 },
  // Charlotte, NC metro
  { id: "concordnc", name: "Concord", state: "NC", lat: 35.4088, lng: -80.5795, zoom: 12 },
  // Raleigh, NC metro
  { id: "durham", name: "Durham", state: "NC", lat: 35.994, lng: -78.8986, zoom: 12 },
  { id: "cary", name: "Cary", state: "NC", lat: 35.7915, lng: -78.7811, zoom: 12 },
  { id: "chapelhill", name: "Chapel Hill", state: "NC", lat: 35.9132, lng: -79.0558, zoom: 12 },
  // Nashville, TN metro
  { id: "franklintn", name: "Franklin", state: "TN", lat: 35.9251, lng: -86.8689, zoom: 12 },
  { id: "murfreesboro", name: "Murfreesboro", state: "TN", lat: 35.8456, lng: -86.3903, zoom: 12 },
  // Boston, MA metro
  { id: "cambridge", name: "Cambridge", state: "MA", lat: 42.3736, lng: -71.1097, zoom: 13 },
  { id: "somerville", name: "Somerville", state: "MA", lat: 42.3876, lng: -71.0995, zoom: 13 },
  { id: "quincy", name: "Quincy", state: "MA", lat: 42.2529, lng: -71.0023, zoom: 12 },
  { id: "newton", name: "Newton", state: "MA", lat: 42.337, lng: -71.2092, zoom: 12 },
  { id: "worcester", name: "Worcester", state: "MA", lat: 42.2626, lng: -71.8023, zoom: 12 },
  // Washington, DC metro
  { id: "alexandria", name: "Alexandria", state: "VA", lat: 38.8048, lng: -77.0469, zoom: 13 },
  { id: "arlingtonva", name: "Arlington", state: "VA", lat: 38.8799, lng: -77.1068, zoom: 13 },
  { id: "bethesda", name: "Bethesda", state: "MD", lat: 38.9847, lng: -77.0947, zoom: 13 },
  { id: "silverspring", name: "Silver Spring", state: "MD", lat: 38.9907, lng: -77.0261, zoom: 13 },
  // Baltimore, MD metro
  { id: "columbiamd", name: "Columbia", state: "MD", lat: 39.2037, lng: -76.861, zoom: 12 },
  // Philadelphia, PA metro
  { id: "camden", name: "Camden", state: "NJ", lat: 39.9259, lng: -75.1196, zoom: 13 },
  { id: "cherryhill", name: "Cherry Hill", state: "NJ", lat: 39.9348, lng: -75.0307, zoom: 12 },
  // Minneapolis, MN metro
  { id: "stpaul", name: "St. Paul", state: "MN", lat: 44.9537, lng: -93.09, zoom: 12 },
  { id: "bloomingtonmn", name: "Bloomington", state: "MN", lat: 44.8408, lng: -93.2983, zoom: 12 },
  // Chicago, IL metro
  { id: "naperville", name: "Naperville", state: "IL", lat: 41.7508, lng: -88.1535, zoom: 12 },
  { id: "aurorail", name: "Aurora", state: "IL", lat: 41.7606, lng: -88.3201, zoom: 12 },
  { id: "joliet", name: "Joliet", state: "IL", lat: 41.525, lng: -88.0817, zoom: 12 },
  { id: "evanston", name: "Evanston", state: "IL", lat: 42.0451, lng: -87.6877, zoom: 13 },
  // New York City metro
  { id: "newark", name: "Newark", state: "NJ", lat: 40.7357, lng: -74.1724, zoom: 12 },
  { id: "jerseycity", name: "Jersey City", state: "NJ", lat: 40.7178, lng: -74.0431, zoom: 12 },
  { id: "yonkers", name: "Yonkers", state: "NY", lat: 40.9312, lng: -73.8987, zoom: 12 },
  // Kansas City metro
  { id: "overlandpark", name: "Overland Park", state: "KS", lat: 38.9822, lng: -94.6708, zoom: 12 },
  // Oklahoma City, OK metro
  { id: "norman", name: "Norman", state: "OK", lat: 35.2226, lng: -97.4395, zoom: 12 },
  { id: "edmond", name: "Edmond", state: "OK", lat: 35.6528, lng: -97.4781, zoom: 12 },
  // Las Vegas, NV metro
  { id: "henderson", name: "Henderson", state: "NV", lat: 36.0395, lng: -114.9817, zoom: 12 },
  { id: "northlasvegas", name: "North Las Vegas", state: "NV", lat: 36.1989, lng: -115.1175, zoom: 12 },
  // Cleveland, OH metro
  { id: "akron", name: "Akron", state: "OH", lat: 41.0814, lng: -81.519, zoom: 12 },
  // Detroit, MI metro
  { id: "dearborn", name: "Dearborn", state: "MI", lat: 42.3223, lng: -83.1763, zoom: 12 },
  { id: "warrenmi", name: "Warren", state: "MI", lat: 42.5145, lng: -83.0147, zoom: 12 },
  { id: "annarbor", name: "Ann Arbor", state: "MI", lat: 42.2808, lng: -83.743, zoom: 12 },
  // Indianapolis, IN metro
  { id: "carmel", name: "Carmel", state: "IN", lat: 39.9784, lng: -86.118, zoom: 12 },
  { id: "fishers", name: "Fishers", state: "IN", lat: 39.9568, lng: -86.0139, zoom: 12 },
  // Albuquerque, NM metro
  { id: "riorancho", name: "Rio Rancho", state: "NM", lat: 35.2328, lng: -106.663, zoom: 12 },
  // Virginia Beach, VA metro
  { id: "norfolk", name: "Norfolk", state: "VA", lat: 36.8508, lng: -76.2859, zoom: 12 },
  { id: "chesapeake", name: "Chesapeake", state: "VA", lat: 36.7682, lng: -76.2875, zoom: 12 },
];

export function getCity(id: string): CityConfig | undefined {
  return CITIES.find((c) => c.id === id);
}
