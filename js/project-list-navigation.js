// Use one scroll destination for every entrance to the same project.
(() => {
  const anchors = {
    '#project-hmi': 'hmi', '#hmi-title': 'hmi',
    '#project-wego': 'wego', '#wego-title': 'wego',
    '#project-urt': 'urt', '#urt-title': 'urt'
  };
  const url = new URL(location.href);
  let project = url.searchParams.get('project') || anchors[url.hash];
  if (!['hmi', 'wego', 'urt'].includes(project)) return;

  // Remove the native fragment jump, including links from older cached pages.
  // Otherwise it can overwrite our position after fonts or history are restored.
  function normalizeURL() {
    const current = new URL(location.href);
    current.searchParams.set('project', project);
    current.hash = '';
    history.replaceState(history.state, '', current);
  }
  normalizeURL();
  history.scrollRestoration = 'manual';

  function positionProject() {
    const section = document.getElementById(`project-${project}`);
    if (!section) return;
    const panel = document.querySelector('.project-list-panel');
    if (panel) panel.scrollTop = 0;
    const top = project === 'hmi' ? 0 : project === 'urt'
      ? document.documentElement.scrollHeight - window.innerHeight
      : window.scrollY + section.getBoundingClientRect().top - Math.max(0, (window.innerHeight - 432) / 2);
    window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  }
  let frame;
  function schedulePosition() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(positionProject);
    });
  }
  window.addEventListener('pageshow', schedulePosition);
  window.addEventListener('load', schedulePosition);
  window.addEventListener('resize', schedulePosition);
  window.addEventListener('hashchange', () => {
    const next = anchors[location.hash];
    if (next) { project = next; normalizeURL(); schedulePosition(); }
  });
  document.fonts.ready.then(schedulePosition);
  schedulePosition();
})();
