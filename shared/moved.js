/* Dėdės Baldai apps moved to https://app.dedesbaldai.lt
   Every old page loads only this. It
   1) retires this old address's service workers (no double notifications,
      no stale offline copies),
   2) the first time on this device, carries the apps' SETTINGS over
      (price list, Nesting machine settings, DXF drawing, XXL Fix settings,
      languages…) — never sign-ins or passwords — via the address #fragment,
      which is not sent to any server,
   3) opens the same page on the new address. */
(function () {
  "use strict";
  var NEW = "https://app.dedesbaldai.lt";
  var ALLOW = /^(dbKurejas\.|dbRR\.|dedesBaldai\.(calc|baseline|history)|ncSettings$|nestDefaults$|fabflow_xlsm_|fabflow_lang$|pwColWidths$|ebLastName$|dxfed\.|cad$|xxlfix\.|dedes\.prasymai\.|hub-|shopflow\.(lang|theme)$|workshop\.lastName$|notices\.people\.v1$|cp\.)/;
  var target = location.pathname + location.search + location.hash;
  var gone = false;
  function go(url) { if (gone) return; gone = true; location.replace(url); }
  setTimeout(function () { go(NEW + target); }, 5000);   // never get stuck here

  var cleanup = Promise.resolve();
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations)
      cleanup = navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); });
    if (window.caches && caches.keys)
      cleanup = cleanup.then(function () { return caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }); });
  } catch (e) {}
  cleanup = cleanup.catch(function () {});

  var moved = null; try { moved = localStorage.getItem("moved.to.app"); } catch (e) {}
  if (moved) { cleanup.then(function () { go(NEW + target); }); return; }

  var data = {}, n = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (ALLOW.test(k)) { data[k] = localStorage.getItem(k); n++; }
    }
  } catch (e) {}
  try { localStorage.setItem("moved.to.app", String(Date.now())); } catch (e) {}
  if (!n) { cleanup.then(function () { go(NEW + target); }); return; }

  function b64u(bytes) { var s = "", b = new Uint8Array(bytes); for (var j = 0; j < b.length; j += 0x8000) s += String.fromCharCode.apply(null, b.subarray(j, j + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  var json = JSON.stringify(data), bytes = new TextEncoder().encode(json);
  var pack = window.CompressionStream
    ? new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer().then(function (buf) { return "z." + b64u(buf); })
    : Promise.resolve("j." + b64u(bytes));
  Promise.all([pack, cleanup]).then(function (r) {
    go(NEW + "/hub/migrate.html#to=" + encodeURIComponent(target) + "&m=" + r[0]);
  }, function () { go(NEW + target); });
})();
