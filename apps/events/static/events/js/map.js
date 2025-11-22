// events/static/events/js/map.js

console.log("[map] map.js cargado");

// Estado global del mapa de la lista de eventos
window.vividMap = null;
window.vividMarkersById = new Map();
window.vividUserMarker = null;

// Estilo y centro por defecto
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const FALLBACK_CENTER = [-70.6483, -33.4569]; // Santiago

// Helper para escapar HTML
window.escapeHtml = function (str) {
  str = str ==null ? '': String(str)
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

// Lee eventos desde las cards del DOM
window.getEventsFromDOM = function () {
  return [...document.querySelectorAll(".event-card")].map((card) => {
    const id = Number(card.dataset.id || card.dataset.eventId);
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    const name =
      (card.querySelector(".event-title")?.textContent || "Evento").trim();
    const location =
      (card.querySelector(".event-location")?.textContent || "").trim();

    return {
      id,
      name,
      location,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
  });
};

// Inicializa el mapa de la lista de eventos
window.initEventListMap = function () {
  console.log("[map] initEventListMap");

  if (typeof maplibregl === "undefined") {
    console.error("[map] MapLibre no está cargado");
    return;
  }
  const mapEl = document.getElementById("map");
  if (!mapEl) {
    console.error("[map] Falta #map");
    return;
  }

  window.vividMap = new maplibregl.Map({
    container: "map",
    style: STYLE_URL,
    center: FALLBACK_CENTER,
    zoom: 11,
  });
  window.vividMap.addControl(new maplibregl.NavigationControl(), "top-right");

  window.vividMap.on("load", () => {
    window.vividMap.resize();
    setTimeout(() => window.vividMap.resize(), 100);

    window.updateMapMarkers();
    window.attachCardClickListeners();
  });
};

// Crea/actualiza los marcadores del mapa según las cards visibles
window.updateMapMarkers = function () {
  if (!window.vividMap) {
    console.warn("[map] vividMap no inicializado");
    return;
  }

  // Limpiar marcadores de eventos anteriores
  window.vividMarkersById.forEach((m) => m.remove());
  window.vividMarkersById.clear();

  const eventos = window.getEventsFromDOM();
  const valid = eventos.filter(
    (e) => Number.isFinite(e.lat) && Number.isFinite(e.lng)
  );
  console.log("[map] eventos desde DOM:", eventos);
  console.log("[map] válidos (coords):", valid.length);

  if (!valid.length) {
    window.vividMap.flyTo({ center: FALLBACK_CENTER, zoom: 11 });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();

  valid.forEach((e) => {
    const marker = new maplibregl.Marker({ color: "#ff7a00" })
      .setLngLat([e.lng, e.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="padding:10px;max-width:240px">
            <h4 style="margin:0 0 8px 0;color:#333;">${window.escapeHtml(
              e.name
            )}</h4>
            ${
              e.location
                ? `<div style="margin:0 0 6px 0;color:#555;">${window.escapeHtml(
                    e.location
                  )}</div>`
                : ""
            }
            <div style="font-size:12px;color:#666;">(${e.lat.toFixed(
              6
            )}, ${e.lng.toFixed(6)})</div>
          </div>
        `)
      )
      .addTo(window.vividMap);

    window.vividMarkersById.set(e.id, marker);
    bounds.extend([e.lng, e.lat]);
  });

  // Si el filtro activo es "cercanos" y tenemos ubicación de usuario,
  // centramos en el usuario y no hacemos fitBounds
  const activeFilterBtn = document.querySelector(".filter-btn.active");
  const isCercanos =
    activeFilterBtn && activeFilterBtn.dataset.filter === "cercanos";

  if (
    isCercanos &&
    window.currentUserLocation &&
    typeof window.currentUserLocation.lat === "number" &&
    typeof window.currentUserLocation.lng === "number"
  ) {
    console.log(
      "[map] centrando en ubicación de usuario desde updateMapMarkers:",
      window.currentUserLocation
    );

    if (!window.vividUserMarker) {
      window.vividUserMarker = new maplibregl.Marker({ color: "#2563eb" })
        .setLngLat([
          window.currentUserLocation.lng,
          window.currentUserLocation.lat,
        ])
        .addTo(window.vividMap);
    } else {
      window.vividUserMarker.setLngLat([
        window.currentUserLocation.lng,
        window.currentUserLocation.lat,
      ]);
    }

    window.vividMap.flyTo({
      center: [window.currentUserLocation.lng, window.currentUserLocation.lat],
      zoom: 14,
      duration: 800,
    });

    return;
  }

  // Comportamiento normal si no es "cercanos"
  if (!bounds.isEmpty() && valid.length >= 2) {
    window.vividMap.fitBounds(bounds, {
      padding: 60,
      maxZoom: 15,
      duration: 600,
    });
  } else if (valid.length === 1) {
    window.vividMap.flyTo({
      center: [valid[0].lng, valid[0].lat],
      zoom: 16,
    });
    window.vividMarkersById.get(valid[0].id)?.togglePopup();
  }
};

// Vuelve a asociar los listeners de click a las cards
window.attachCardClickListeners = function () {
  // limpiar posibles handlers anteriores
  document.querySelectorAll(".event-card").forEach((card) => {
    card.style.cursor = "pointer";
    const clone = card.cloneNode(true);
    card.replaceWith(clone);
  });

  document.querySelectorAll(".event-card").forEach((card) => {
    const id = Number(card.dataset.id || card.dataset.eventId);
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);

    card.addEventListener("click", (ev) => {
      if (ev.target.closest(".details-btn")) return;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      window.vividMap.flyTo({ center: [lng, lat], zoom: 16 });
      window.vividMarkersById.get(id)?.togglePopup();

      document
        .querySelectorAll(".event-card")
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });
};

// Centrar mapa en la ubicación del usuario (lo usa filter.js)
window.centerMapOnUserLocation = function (location) {
  if (!window.vividMap) {
    console.warn("[map] vividMap no inicializado (centerMapOnUserLocation)");
    return;
  }
  if (
    !location ||
    typeof location.lat !== "number" ||
    typeof location.lng !== "number"
  ) {
    console.warn("[map] location inválida en centerMapOnUserLocation:", location);
    return;
  }

  if (!window.vividUserMarker) {
    window.vividUserMarker = new maplibregl.Marker({ color: "#2563eb" })
      .setLngLat([location.lng, location.lat])
      .addTo(window.vividMap);
  } else {
    window.vividUserMarker.setLngLat([location.lng, location.lat]);
  }

  window.vividMap.flyTo({
    center: [location.lng, location.lat],
    zoom: 16,
    duration: 800,
  });
};

// Mapa de detalle de un solo evento
window.initEventDetailMap = function () {
  console.log("[map] initEventDetailMap");

  if (typeof maplibregl === "undefined") {
    console.error("[map] MapLibre no está cargado");
    return;
  }

  const mapEl = document.getElementById("detail-map");
  if (!mapEl) {
    console.error("[map] Falta #detail-map");
    return;
  }

  const lat = parseFloat(mapEl.dataset.lat);
  const lng = parseFloat(mapEl.dataset.lng);
  const name = mapEl.dataset.name || "Evento";
  const location = mapEl.dataset.location || "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error("[map] coords inválidas en #detail-map", lat, lng);
    return;
  }

  // Reutilizamos el mismo mapa global
  window.vividMap = new maplibregl.Map({
    container: "detail-map",
    style: STYLE_URL, // mismo estilo que en la lista
    center: [lng, lat],
    zoom: 15,
  });

  window.vividMap.addControl(new maplibregl.NavigationControl(), "top-right");

  window.vividMap.on("load", () => {
    const popupHtml = `
      <div style="padding:10px;max-width:240px">
        <h4 style="margin:0 0 8px 0;color:#333;">${window.escapeHtml(name)}</h4>
        ${
          location
            ? `<div style="margin:0 0 6px 0;color:#555;">${window.escapeHtml(
                location
              )}</div>`
            : ""
        }
        <div style="font-size:12px;color:#666;">(${lat.toFixed(
          6
        )}, ${lng.toFixed(6)})</div>
      </div>
    `;

    const marker = new maplibregl.Marker({ color: "#ff7a00" })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml))
      .addTo(window.vividMap);

    // Abrir popup por defecto
    marker.togglePopup();

  });
};
