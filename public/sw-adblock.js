// sw-adblock.js — Ad-blocking Service Worker for GodenStream
// Intercepts all fetch requests and blocks known ad/tracker domains.
// Works for same-origin requests AND the initial iframe navigation requests.

const CACHE_VERSION = 'adblock-v1';

// Known ad/tracker domains commonly found in video streaming embeds.
// Add more as needed — each entry is a substring match on the URL hostname.
const BLOCKED_DOMAINS = [
  // === Pop-under / Pop-up networks ===
  'popads.net',
  'popcash.net',
  'popmyads.com',
  'popunder.ru',
  'propellerads.com',
  'propellerclick.com',
  'onclickads.net',
  'onclickads.com',
  'onclickmega.com',
  'onclicksuper.com',
  'onclickmax.com',
  'onclickclear.com',
  'onclkds.com',
  'onclckdisc.com',

  // === Video ad networks ===
  'exoclick.com',
  'exosrv.com',
  'jads.co',
  'juicyads.com',
  'trafficjunky.com',
  'trafficjunky.net',
  'traffichaus.com',

  // === Ad exchanges ===
  'adskeeper.com',
  'mgid.com',
  'revcontent.com',
  'taboola.com',
  'outbrain.com',
  'zergnet.com',

  // === Banner / Script ad networks ===
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'ads.pubmatic.com',
  'adnxs.com',
  'adsrvr.org',
  'criteo.com',
  'rubiconproject.com',
  'openx.net',
  'bidswitch.net',
  'casalemedia.com',

  // === Streaming-specific ad domains ===
  'cdn4ads.com',
  'cdn4image.com',
  'cloudfront.net/ad',
  'adsturn.com',
  'ad-maven.com',
  'hilltopads.net',
  'hilltopads.com',
  'frequentim.com',
  'recreativ.ru',
  'shukriya90.com',
  'intendev.com',

  // === Redirect / Cloaker domains ===
  's.go-mpulse.net',
  'mp4upload.com/ads',
  'streamtape.com/ads',
  'doodcdn.com/ads',

  // === Analytics / Trackers (optional — remove if needed) ===
  'analytics.google.com',
  'hotjar.com',
  'mixpanel.com',

  // === Common in Asian streaming embeds ===
  'adpopcorn.com',
  'adtrue.com',
  'adplexo.com',
  'expofuture.com',
  'rtmark.net',
  'ptwmstc.com',
  'optad360.io',
  'unpkg.com/ad',
  'a-ads.com',
];

// Additional URL pattern matches (substring anywhere in URL)
const BLOCKED_URL_PATTERNS = [
  '/ads/',
  '/adserver/',
  '/banner/',
  '/popunder',
  '/popup/',
  '/prebid',
  'ad_type=',
  'ad_tag=',
  'vast.xml',
  'vmap.xml',
  'doubleclick.',
  'googlesyndication.',
  '&ad_id=',
  '&adzone=',
];

// Self-activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Claim all clients on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Check if a URL should be blocked.
 * Returns true if the URL matches any blocked domain or pattern.
 */
function shouldBlock(url) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return false;
  }

  let hostname = '';
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }

  // Skip our own domain and API
  if (
    hostname.includes('godenpg.dev') ||
    hostname.includes('stream.godenpg.dev') ||
    hostname === 'localhost' ||
    hostname === ''
  ) {
    return false;
  }

  // Check domain blocklist
  for (const domain of BLOCKED_DOMAINS) {
    if (hostname.includes(domain) || hostname.endsWith('.' + domain)) {
      return true;
    }
  }

  // Check URL pattern blocklist
  const urlLower = url.toLowerCase();
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (urlLower.includes(pattern)) {
      return true;
    }
  }

  return false;
}

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Only block GET requests (ads are almost always GET)
  if (event.request.method !== 'GET') return;

  if (shouldBlock(url)) {
    event.respondWith(
      new Response('', {
        status: 204,
        statusText: 'Blocked by adblock',
        headers: { 'X-Adblock': 'blocked' },
      })
    );
    return;
  }
});

// Allow external update trigger
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  // Allow runtime blocklist additions
  if (event.data?.type === 'addBlockedDomain') {
    const domain = event.data.domain;
    if (domain && !BLOCKED_DOMAINS.includes(domain)) {
      BLOCKED_DOMAINS.push(domain);
    }
  }
});
