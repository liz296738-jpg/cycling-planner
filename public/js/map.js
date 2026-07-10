const CyclingMap = (() => {
  let map = null;
  let routeLine = null;
  let glowLine = null;
  let markers = [];
  let currentPopup = null;

  function init(containerId) {
    map = L.map(containerId, {
      center: [39.90923, 116.397428],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
  }

  function clearOverlays() {
    if (currentPopup) { map.closePopup(currentPopup); currentPopup = null; }
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    if (glowLine) { map.removeLayer(glowLine); glowLine = null; }
    markers.forEach(m => map.removeLayer(m));
    markers = [];
  }

  function drawRoute(coordinates) {
    if (!coordinates || coordinates.length < 2) return;

    const path = coordinates.map(([lng, lat]) => [lat, lng]);

    glowLine = L.polyline(path, {
      color: 'rgba(0, 230, 118, 0.2)',
      weight: 14,
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.6,
    }).addTo(map);

    routeLine = L.polyline(path, {
      color: '#00e676',
      weight: 5,
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.9,
    }).addTo(map);
  }

  function createMarkerHTML(type, label) {
    const colors = {
      start: { bg: '#00e676', text: '起' },
      end: { bg: '#ff5252', text: '终' },
      waypoint: { bg: '#448aff', text: String(label) },
    };
    const c = colors[type];
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="width:34px;height:34px;border-radius:50%;background:${c.bg};color:#000;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 14px ${c.bg}80;border:2px solid rgba(255,255,255,0.3);font-family:'Inter',sans-serif;">${c.text}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }

  function addMarker(position, type, label, infoContent) {
    const marker = L.marker([position[1], position[0]], {
      icon: createMarkerHTML(type, label),
    }).addTo(map);

    if (infoContent) {
      marker.bindPopup(`<div style="font-family:'Inter',sans-serif;font-size:13px;color:#e8eaed;"><strong>${infoContent}</strong></div>`, {
        className: 'leaflet-popup-dark',
        closeButton: false,
        offset: [0, -20],
      });
      marker.on('click', () => {
        if (currentPopup) map.closePopup(currentPopup);
        marker.openPopup();
        currentPopup = marker.getPopup();
      });
    }

    markers.push(marker);
  }

  function addStartMarker(position, name) {
    addMarker(position, 'start', '', name);
  }

  function addEndMarker(position, name) {
    addMarker(position, 'end', '', name);
  }

  function addWaypointMarkers(waypoints) {
    if (!waypoints || !Array.isArray(waypoints)) return;
    waypoints.forEach((wp, i) => {
      if (wp.coordinate && wp.coordinate.length === 2) {
        addMarker(wp.coordinate, 'waypoint', i + 1, wp.name);
      }
    });
  }

  function fitBounds(coordinates) {
    if (!coordinates || coordinates.length === 0) return;
    const bounds = coordinates.map(([lng, lat]) => [lat, lng]);
    map.fitBounds(bounds, { padding: [60, 60] });
  }

  function setLoading(loading) {
    const overlay = document.getElementById('map-loading');
    if (loading) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }

  function hidePlaceholder() {
    const ph = document.getElementById('map-placeholder');
    if (ph) ph.classList.add('hidden');
  }

  return {
    init, drawRoute, addStartMarker, addEndMarker,
    addWaypointMarkers, clearOverlays, fitBounds,
    setLoading, hidePlaceholder,
  };
})();
