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
  str = str == null ? "" : String(str);
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

    // Leer crudo desde data-*, puede venir con coma o punto
    const rawLat = card.dataset.lat;
    const rawLng = card.dataset.lng;

    const lat = rawLat != null && rawLat !== ""
      ? Number(String(rawLat).trim().replace(",", "."))
      : NaN;

    const lng = rawLng != null && rawLng !== ""
      ? Number(String(rawLng).trim().replace(",", "."))
      : NaN;

    const name =
      (card.querySelector(".event-title")?.textContent || "Evento").trim();

    const location =
      (card.querySelector(".event-location")?.textContent || "").trim();

    const datetime =
      (card.querySelector(".event-datetime")?.textContent || "").trim();

    return {
      id,
      name,
      location,
      datetime,
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

  // Marcadores con popup estilizado (lista de eventos)
  valid.forEach((e) => {
  const marker = new maplibregl.Marker({ color: "#ff7a00" })
    .setLngLat([e.lng, e.lat])
    .setPopup(
      new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="
          padding:10px;
          max-width:260px;
          font-family:'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          background:#e0f2ff;              /* celeste claro */
          border-radius:8px;
          box-shadow:0 2px 6px rgba(0,0,0,0.15);
        ">
          <h4 style="
            margin:0 0 4px 0;
            font-size:15px;
            font-weight:600;
            color:#111827;
          ">
            ${window.escapeHtml(e.name)}
          </h4>

          ${
            e.location
              ? `<div style="
                   margin:0 0 4px 0;
                   font-size:13px;
                   color:#4b5563;
                 ">
                   ${window.escapeHtml(e.location)}
                 </div>`
              : ""
          }

          ${
            e.datetime
              ? `<div style="
                   margin:0 0 6px 0;
                   font-size:13px;
                   font-weight:500;
                   color:#374151;
                 ">
                   🕒 ${window.escapeHtml(e.datetime)}
                 </div>`
              : ""
          }

          <div style="
            margin-top:2px;
            font-size:11px;
            color:#6b7280;
          ">
            (${e.lat.toFixed(6)}, ${e.lng.toFixed(6)})
          </div>
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
  console.log('[map] attachCardClickListeners llamado');
  
  // NO clonar las cards porque eso destruye los listeners de los botones de suscripción
  // En su lugar, solo eliminar listeners existentes de las cards si ya tienen el flag
  document.querySelectorAll(".event-card").forEach((card) => {
    card.style.cursor = "pointer";
    
    // Si ya tiene listener de card, no agregar otro
    if (card.dataset.cardListenerAttached === 'true') {
      return;
    }
    card.dataset.cardListenerAttached = 'true';
    
    const id = Number(card.dataset.id || card.dataset.eventId);
    const rawLat = card.dataset.lat;
    const rawLng = card.dataset.lng;

    const lat = rawLat != null && rawLat !== ""
      ? Number(String(rawLat).trim().replace(",", "."))
      : NaN;

    const lng = rawLng != null && rawLng !== ""
      ? Number(String(rawLng).trim().replace(",", "."))
      : NaN;

    card.addEventListener("click", (ev) => {
      // Ignorar clicks en botones y enlaces
      if (ev.target.closest(".details-btn")) return;
      if (ev.target.closest(".attend-btn")) return;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      window.vividMap.flyTo({ center: [lng, lat], zoom: 16 });
      window.vividMarkersById.get(id)?.togglePopup();

      document
        .querySelectorAll(".event-card")
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });
  
  // Después de agregar listeners a las cards, reinicializar los de suscripción
  if (typeof window.initSubscriptionListeners === 'function') {
    console.log('[map] Reinicializando listeners de suscripción después de agregar listeners a cards');
    window.initSubscriptionListeners();
  }
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
  const datetime = mapEl.dataset.datetime || "";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error("[map] coords inválidas en #detail-map", lat, lng);
    return;
  }

  const detailMap = new maplibregl.Map({
    container: "detail-map",
    style: STYLE_URL,
    center: [lng, lat],
    zoom: 15,
  });

  detailMap.addControl(new maplibregl.NavigationControl(), "top-right");

  // ✅ CRÍTICO: Crear el marcador del evento
  detailMap.on("load", () => {
    console.log("[map] Mapa de detalle cargado, agregando marcador");
    
    // Crear marcador con popup estilizado
    new maplibregl.Marker({ color: "#ff7a00" })
      .setLngLat([lng, lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div style="
            padding:10px;
            max-width:260px;
            font-family:'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            background:#e0f2ff;
            border-radius:8px;
            box-shadow:0 2px 6px rgba(0,0,0,0.15);
          ">
            <h4 style="
              margin:0 0 4px 0;
              font-size:15px;
              font-weight:600;
              color:#111827;
            ">
              ${window.escapeHtml(name)}
            </h4>

            ${
              location
                ? `<div style="
                     margin:0 0 4px 0;
                     font-size:13px;
                     color:#4b5563;
                   ">
                     📍 ${window.escapeHtml(location)}
                   </div>`
                : ""
            }

            ${
              datetime
                ? `<div style="
                     margin:0 0 6px 0;
                     font-size:13px;
                     font-weight:500;
                     color:#374151;
                   ">
                     🕒 ${window.escapeHtml(datetime)}
                   </div>`
                : ""
            }

            <div style="
              margin-top:2px;
              font-size:11px;
              color:#6b7280;
            ">
              (${lat.toFixed(6)}, ${lng.toFixed(6)})
            </div>
          </div>
        `)
      )
      .addTo(detailMap);
      
    console.log(`[map] ✅ Marcador agregado en [${lng}, ${lat}]`);
  });
}
