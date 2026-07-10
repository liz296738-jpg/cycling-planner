const UI = (() => {
  let toastTimer = null;

  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.addEventListener('click', () => dismissToast(toast));
    container.appendChild(toast);

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dismissToast(toast), 5000);
  }

  function dismissToast(toast) {
    toast.classList.add('toast-removing');
    setTimeout(() => toast.remove(), 300);
  }

  function showLoading(message) {
    const btn = document.getElementById('plan-btn');
    btn.disabled = true;
    btn.querySelector('span').textContent = message || '规划中...';
    CyclingMap.setLoading(true);
  }

  function hideLoading() {
    const btn = document.getElementById('plan-btn');
    btn.disabled = false;
    btn.querySelector('span').textContent = '规划路线';
    CyclingMap.setLoading(false);
  }

  function showError(message) {
    showToast(message, 'error');
    hideLoading();
  }

  function showSuccess(message) {
    showToast(message, 'success');
  }

  function formatDistance(km) {
    return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`;
  }

  function formatElevation(m) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  }

  function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  function updateRouteDetails(data) {
    const empty = document.getElementById('details-empty');
    const content = document.getElementById('details-content');
    empty.style.display = 'none';
    content.style.display = 'block';

    const { summary, directions, tips } = data;

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card accent">
        <div class="stat-value">${formatDistance(summary.totalDistance)}</div>
        <div class="stat-label">总距离</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatElevation(summary.totalElevationGain)}</div>
        <div class="stat-label">累计爬升</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatTime(summary.estimatedTime)}</div>
        <div class="stat-label">预计时间</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${summary.difficulty || '--'}</div>
        <div class="stat-label">难度</div>
      </div>
    `;

    if (directions && directions.length > 0) {
      const maneuvers = { '直行': '↑', '左转': '↰', '右转': '↱', '调头': '↶', '到达': '★' };
      document.getElementById('directions-list').innerHTML = directions.map((d, i) => `
        <div class="direction-item">
          <div class="direction-icon">${maneuvers[d.maneuver] || '→'}</div>
          <div class="direction-info">
            <div class="direction-text">${d.instruction}</div>
            <div class="direction-meta">${d.roadName} · ${d.distance >= 1000 ? (d.distance / 1000).toFixed(1) + ' km' : d.distance + ' m'}</div>
          </div>
        </div>
      `).join('');
    }

    if (tips && tips.length > 0) {
      document.getElementById('tips-list').innerHTML = tips.map(t => `
        <div class="tip-item">
          <span class="tip-icon">💡</span>
          <span>${t}</span>
        </div>
      `).join('');
    }
  }

  function resetDetails() {
    document.getElementById('details-empty').style.display = '';
    document.getElementById('details-content').style.display = 'none';
  }

  function setFormEnabled(enabled) {
    const inputs = document.querySelectorAll('#route-form input, #route-form select, #route-form button');
    inputs.forEach(el => { el.disabled = !enabled; });
  }

  return {
    showLoading, hideLoading, showError, showSuccess,
    updateRouteDetails, resetDetails, setFormEnabled,
    formatDistance, formatElevation, formatTime,
  };
})();
