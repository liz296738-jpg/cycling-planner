const App = (() => {
  function init() {
    UI.init();
    MapManager.init();

    document.getElementById('plan-btn').addEventListener('click', planRoute);
  }

  async function planRoute() {
    const start = document.getElementById('start-input').value.trim();
    const end = document.getElementById('end-input').value.trim();

    if (!start || !end) {
      UI.showToast('起点和终点不能为空', true);
      return;
    }

    const payload = {
      start: start,
      end: end,
      preferences: {
        maxDistance: parseInt(document.getElementById('max-dist').value),
        maxElevation: parseInt(document.getElementById('max-elev').value),
        surfaceType: document.getElementById('surface-type').value,
        difficulty: document.getElementById('difficulty').value
      }
    };

    UI.setLoading(true);

    try {
      const res = await fetch('/api/plan-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || '服务器错误');
      }

      MapManager.drawRoute(json.data);
      UI.renderDetails(json.data);
      UI.showToast('路线规划成功！', false);
    } catch (err) {
      UI.showToast(err.message || '网络连接出错，请稍后重试', true);
    } finally {
      UI.setLoading(false);
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
