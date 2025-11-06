// ==================================================
// Guard: evita doble ejecución si el script se carga 2 veces
// ==================================================
if (!window.__VIVID_MAP_INIT__) {
  window.__VIVID_MAP_INIT__ = true;

  let map; // una sola vez
  const markersById = new Map();
  const STYLE_URL = "https://demotiles.maplibre.org/style.json"; // estilo remoto OK

  document.addEventListener("DOMContentLoaded", () => {
    const dataEl = document.getElementById("eventos-data");
    if (!dataEl) {
      console.warn("[map] No se encontró #eventos-data");
      return;
    }

    let eventos = [];
    try {
      eventos = JSON.parse(dataEl.textContent || "[]");
    } catch (e) {
      console.error("[map] Error al parsear eventos:", e);
      return;
    }

    // Normaliza por si llegan strings
    eventos = eventos.map(e => ({
      ...e,
      lat: e.lat != null ? parseFloat(e.lat) : null,
      lng: e.lng != null ? parseFloat(e.lng) : null,
    }));

    console.log("[map] eventos cargados:", eventos.length, eventos[0] || null);

    initMap(eventos);
    setupEventCardClicks();
  });

  function initMap(eventos) {
    if (typeof maplibregl === "undefined") {
      console.error("[map] MapLibre GL no está cargado");
      return;
    }

    const fallbackCenter = [-70.6643, -33.4569]; // Santiago

    map = new maplibregl.Map({
      container: "map",
      style: STYLE_URL,
      center: fallbackCenter,
      zoom: 12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      console.log("[map] estilo cargado:", STYLE_URL);
      addEventMarkers(eventos);
      fitToEvents(eventos);
    });

    map.on("error", (e) => {
      console.error("[map] Error:", e && e.error ? e.error : e);
    });
  }

  function addEventMarkers(eventos) {
    const valid = eventos.filter(
      (e) => Number.isFinite(e?.lat) && Number.isFinite(e?.lng)
    );

    valid.forEach((e) => {
      const popupHtml = `
        <div style="padding:10px;max-width:240px">
          <h4 style="margin:0 0 8px 0;color:#333;">${escapeHtml(e.name ?? "Evento")}</h4>
          ${e.location ? `<div style="margin:0 0 8px 0;color:#555;">${escapeHtml(e.location)}</div>` : ""}
          <button
            onclick="scrollToEvent(${Number(e.id)})"
            style="background:#FF7B54;color:#fff;border:none;padding:8px 12px;border-radius:18px;cursor:pointer;font-size:12px;font-weight:600;"
          >
            Ver evento
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: true })
        .setHTML(popupHtml);

      const marker = new maplibregl.Marker({ color: "#ff7a00" }) // pin default naranja
        .setLngLat([e.lng, e.lat])
        .setPopup(popup)
        .addTo(map);

      markersById.set(Number(e.id), { marker, popup });
    });

    console.log("[map] marcadores creados:", valid.length);
  }

  function fitToEvents(eventos) {
    const valid = eventos.filter(
      (e) => Number.isFinite(e?.lat) && Number.isFinite(e?.lng)
    );

    if (valid.length >= 2) {
      const bounds = new maplibregl.LngLatBounds();
      valid.forEach((e) => bounds.extend([e.lng, e.lat]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
      }
    } else if (valid.length === 1) {
      map.flyTo({ center: [valid[0].lng, valid[0].lat], zoom: 14 });
      const ent = markersById.get(Number(valid[0].id));
      ent?.popup && ent.popup.addTo(map);
    } else {
      console.warn("[map] No hay eventos con coordenadas válidas; se queda en fallback.");
    }
  }

  // API pública para otros scripts / inline handlers
  window.showEventOnMap = function showEventOnMap(eventoId) {
    const entry = markersById.get(Number(eventoId));
    if (!entry) return;

    const lngLat = entry.marker.getLngLat();
    map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 16, duration: 800 });

    const once = () => {
      entry.popup.addTo(map);
      map.off("moveend", once);
    };
    map.on("moveend", once);

    highlightCard(eventoId);
  };

  window.scrollToEvent = function scrollToEvent(eventoId) {
    const card =
      document.querySelector(`[data-id="${Number(eventoId)}"]`) ||
      document.querySelector(`[data-event-id="${Number(eventoId)}"]`);

    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      highlightCard(eventoId);
    }
  };

  function highlightCard(eventoId) {
    document.querySelectorAll(".event-card").forEach((c) => c.classList.remove("highlighted"));
    const card =
      document.querySelector(`[data-id="${Number(eventoId)}"]`) ||
      document.querySelector(`[data-event-id="${Number(eventoId)}"]`);
    if (card) {
      card.classList.add("highlighted");
      setTimeout(() => card.classList.remove("highlighted"), 2000);
    }
  }

  function setupEventCardClicks() {
    document.querySelectorAll(".event-card").forEach((card) => {
      card.style.cursor = "pointer";

      card.addEventListener("click", (e) => {
        if (e.target.closest(".attend-btn") || e.target.closest(".details-btn")) return;
        const id = Number(card.dataset.id || card.dataset.eventId);
        if (Number.isFinite(id)) window.showEventOnMap(id);
      });
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
