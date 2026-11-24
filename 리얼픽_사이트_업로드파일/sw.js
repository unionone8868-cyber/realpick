/* 리얼픽 서비스워커
 * - 화면(HTML)과 데이터(JSON)는 항상 인터넷에서 먼저 받고, 연결이 끊겼을 때만 저장해 둔 것을 보여줘요.
 * - 아이콘처럼 잘 안 바뀌는 파일만 먼저 저장본을 써요.
 * - 로그인·AI·서버 기능(Supabase)은 절대 저장하지 않아요.
 */
const VERSION = "rp-v1";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./offline.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // Supabase·지도·사진 등 외부 요청은 손대지 않음
  const isPage = req.mode === "navigate";
  const isData = url.pathname.endsWith(".json") || url.pathname.endsWith("config.js") || url.pathname.endsWith("index.html") || isPage;
  if (isData) {
    // 인터넷 먼저 → 실패하면 저장본 → 그래도 없으면 오프라인 안내
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || (isPage ? caches.match("./offline.html") : Response.error())));
    return;
  }
  // 아이콘 등: 저장본 먼저
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && url.pathname.includes("/icons/")) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});
