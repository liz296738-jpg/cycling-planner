(function () {
  'use strict';

  let lastRoute = null;

  /* ---- DOM refs ---- */
  const form = document.getElementById('route-form');
  const startInput = document.getElementById('start');
  const endInput = document.getElementById('end');
  const distanceSlider = document.getElementById('max-distance');
  const elevationSlider = document.getElementById('max-elevation');
  const distanceValue = document.getElementById('distance-value');
  const elevationValue = document.getElementById('elevation-value');
  const planBtn = document.getElementById('plan-btn');

  /* ---- Slider displays ---- */
  distanceSlider.addEventListener('input', () => {
    distanceValue.textContent = distanceSlider.value + ' km';
  });

  elevationSlider.addEventListener('input', () => {
    const v = parseInt(elevationSlider.value);
    elevationValue.textContent = v === 0 ? '无限制' : v + ' m';
  });

  /* ---- Form submit ---- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const start = startInput.value.trim();
    const end = endInput.value.trim();

    if (!start || !end) {
      UI.showError('请输入起点和终点');
      return;
    }

    if (start === end) {
      UI.showError('起点和终点不能相同');
      return;
    }

    const preferences = {
      maxDistance: parseInt(distanceSlider.value),
    };

    const elev = parseInt(elevationSlider.value);
    if (elev > 0) preferences.maxElevation = elev;

    const surface = document.getElementById('surface-type').value;
    if (surface) preferences.surfaceType = surface;

    const difficulty = document.getElementById('difficulty').value;
    if (difficulty) preferences.difficulty = difficulty;

    UI.showLoading('AI 正在规划路线...');
    CyclingMap.setLoading(true);

    try {
      const res = await fetch('/api/plan-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, preferences }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || '路线规划失败');
      }

      lastRoute = json.data;
      renderRoute(json.data);
      UI.showSuccess('路线规划完成！');
    } catch (err) {
      UI.showError(err.message || '网络错误，请检查连接');
    } finally {
      UI.hideLoading();
    }
  });

  /* ---- Render route ---- */
  function renderRoute(data) {
    CyclingMap.clearOverlays();
    CyclingMap.hidePlaceholder();
    CyclingMap.drawRoute(data.coordinates);

    if (data.coordinates.length > 0) {
      const first = data.coordinates[0];
      const last = data.coordinates[data.coordinates.length - 1];
      const startName = data.waypoints?.[0]?.name || '起点';
      const endName = data.waypoints?.[data.waypoints.length - 1]?.name || '终点';
      CyclingMap.addStartMarker(first, startName);
      CyclingMap.addEndMarker(last, endName);
    }

    CyclingMap.addWaypointMarkers(data.waypoints);
    CyclingMap.fitBounds(data.coordinates);
    UI.updateRouteDetails(data);
  }

  /* ---- Keyboard shortcut ---- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName !== 'BUTTON') {
      if (document.activeElement === startInput || document.activeElement === endInput) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    }
  });

  /* ---- Init ---- */
  function init() {
    CyclingMap.init('map-container');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
