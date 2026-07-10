const MapManager = (() => {
  let map = null;
  let routeLayer = null;
  let markers = [];

  function init() {
    map = L.map('map', { zoomControl: false })
      .setView([39.91, 116.40], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
  }

  function clearMap() {
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const placeholder = document.getElementById('map-placeholder');
    if (placeholder) placeholder.style.opacity = '0';
  }

  function drawRoute(data) {
    clearMap();

    const latLngs = data.coordinates.map(coord => [coord[1], coord[0]]);

    routeLayer = L.polyline(latLngs, {
      color: '#4caf50',
      weight: 6,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    const createIcon = (color, text) => {
      return L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background-color:' + color + ';width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 3px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;transform:translate(-50%,-50%);">' + text + '</div>',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
    };

    if (latLngs.length > 0) {
      markers.push(L.marker(latLngs[0], { icon: createIcon('#4caf50', '起') }).addTo(map));
    }
    if (latLngs.length > 1) {
      markers.push(L.marker(latLngs[latLngs.length - 1], { icon: createIcon('#d97706', '终') }).addTo(map));
    }

    if (data.waypoints && data.waypoints.length > 0) {
      data.waypoints.forEach(wp => {
        const m = L.marker([wp.coordinate[1], wp.coordinate[0]], {
          icon: L.divIcon({
            className: 'custom-waypoint',
            html: '<div style="width:12px;height:12px;background:#fff;border:3px solid #3b82f6;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.2);transform:translate(-50%,-50%);"></div>'
          })
        }).addTo(map);
        m.bindPopup('<b style="font-family:\'Noto Sans SC\'">' + wp.name + '</b><br><span style="color:#666;font-size:12px;">' + wp.description + '</span>');
        markers.push(m);
      });
    }

    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
  }

  return { init, drawRoute };
})();
