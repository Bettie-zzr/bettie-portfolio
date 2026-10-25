// Position the complete project after layout and browser scroll restoration.
(() => {
  const positionProject = () => {
    const requested = new URLSearchParams(location.search).get('project');
    const project = requested || ({ '#project-wego': 'wego', '#project-urt': 'urt' })[location.hash];
    if (!['wego', 'urt'].includes(project)) return;
    const section = document.getElementById(`project-${project}`);
    if (!section) return;
    const panel = document.querySelector('.project-list-panel');
    if (panel) panel.scrollTop = 0;
    const top = project === 'urt'
      ? document.documentElement.scrollHeight - window.innerHeight
      : window.scrollY + section.getBoundingClientRect().top - Math.max(0, (window.innerHeight - 432) / 2);
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  };
  const schedulePosition = () => requestAnimationFrame(() => requestAnimationFrame(positionProject));
  window.addEventListener('pageshow', schedulePosition);
  window.addEventListener('load', schedulePosition);
  window.addEventListener('hashchange', schedulePosition);
})();
