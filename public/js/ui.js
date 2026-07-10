const UI = (() => {
  let toastTimer = null;

  const toastEl = () => document.getElementById('toast');
  const toastMsg = () => document.getElementById('toast-msg');
  const toastIcon = () => document.getElementById('toast-icon');

  function showToast(message, isError) {
    const el = toastEl();
    const msg = toastMsg();
    const icon = toastIcon();
    if (!el || !msg) return;

    msg.textContent = message;
    el.classList.remove('hidden');

    if (isError === false) {
      el.classList.remove('border-l-red-500');
      el.classList.add('border-l-green-500');
      icon.classList.remove('text-red-500');
      icon.classList.add('text-green-500');
      icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
    } else {
      el.classList.remove('border-l-green-500');
      el.classList.add('border-l-red-500');
      icon.classList.remove('text-green-500');
      icon.classList.add('text-red-500');
      icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    }

    setTimeout(() => el.classList.add('toast-show'), 10);

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('toast-show');
      setTimeout(() => el.classList.add('hidden'), 500);
    }, 5000);
  }

  function setLoading(isLoading) {
    const btn = document.getElementById('plan-btn');
    const text = document.getElementById('btn-text');
    if (!btn || !text) return;

    if (isLoading) {
      btn.disabled = true;
      btn.classList.add('opacity-80', 'cursor-not-allowed');
      text.innerHTML = '<span class="loader"></span> AI 正在规划路线...';
    } else {
      btn.disabled = false;
      btn.classList.remove('opacity-80', 'cursor-not-allowed');
      text.textContent = '开始规划路线';
    }
  }

  function renderDetails(data) {
    const empty = document.getElementById('details-empty');
    const content = document.getElementById('details-content');
    if (empty) empty.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    const s = data.summary;
    document.getElementById('stat-dist').textContent = s.totalDistance;
    document.getElementById('stat-elev').textContent = s.totalElevationGain;
    document.getElementById('stat-time').textContent = s.estimatedTime;
    document.getElementById('stat-diff').textContent = s.difficulty + ' / ' + s.surfaceType;

    const dirList = document.getElementById('directions-list');
    dirList.innerHTML = '';
    data.directions.forEach((dir, index) => {
      const isLast = index === data.directions.length - 1;
      const iconColor = index === 0 ? 'text-nature-500' : (isLast ? 'text-earth-500' : 'text-gray-400');
      const dotColor = index === 0 ? 'bg-nature-500 border-nature-200' : (isLast ? 'bg-earth-500 border-earth-200' : 'bg-gray-300 border-gray-100');

      const li = document.createElement('li');
      li.className = 'flex items-start gap-4';
      li.innerHTML = ''
        + '<div class="relative z-10 mt-1 w-6 h-6 rounded-full border-4 ' + dotColor + ' flex-shrink-0 bg-white"></div>'
        + '<div class="flex-1 bg-gray-50/50 rounded-xl p-3 border border-gray-100">'
        +   '<p class="text-sm font-bold text-gray-800">' + dir.instruction + '</p>'
        +   '<div class="flex items-center gap-3 mt-1 text-xs text-gray-500">'
        +     '<span class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>' + dir.distance + 'm</span>'
        +     '<span class="bg-gray-200/50 px-1.5 py-0.5 rounded text-gray-600">' + dir.roadName + '</span>'
        +   '</div>'
        + '</div>';
      dirList.appendChild(li);
    });

    const tipsList = document.getElementById('tips-list');
    tipsList.innerHTML = '';
    data.tips.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      tipsList.appendChild(li);
    });
  }

  function init() {
    const distSlider = document.getElementById('max-dist');
    const distVal = document.getElementById('dist-val');
    const elevSlider = document.getElementById('max-elev');
    const elevVal = document.getElementById('elev-val');

    if (distSlider && distVal) {
      distSlider.addEventListener('input', (e) => {
        distVal.textContent = e.target.value + ' km';
      });
    }
    if (elevSlider && elevVal) {
      elevSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        elevVal.textContent = val == 0 ? '无限制' : val + ' m';
      });
    }
  }

  return { showToast, setLoading, renderDetails, init };
})();
