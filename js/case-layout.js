(() => {
  const sections = [...document.querySelectorAll('.case-section')].filter(section =>
    section.matches('.case-overview, .case-challenge, .case-approach, .case-reflection, .wego-overview, .wego-challenge, .wego-approach, .urt-challenge, .urt-approach')
  );
  const desktop = window.matchMedia('(min-width: 601px)');
  let frame;

  function updateSpacing() {
    frame = undefined;
    sections.forEach(section => {
      if (!desktop.matches) {
        section.style.removeProperty('--case-bottom-space');
        return;
      }
      const children = [...section.children];
      if (!children.length) return;
      const first = children[0].getBoundingClientRect();
      const last = children[children.length - 1].getBoundingClientRect();
      const body = section.querySelector('.reflection__body, .approach__body');
      const bodyStyle = body ? getComputedStyle(body) : null;
      // Exclude the body's centering space from its natural content height.
      const bodySpace = bodyStyle ? parseFloat(bodyStyle.paddingTop) + parseFloat(bodyStyle.paddingBottom) : 0;
      const contentHeight = last.bottom - first.top - bodySpace;
      const stageHeight = parseFloat(getComputedStyle(section).getPropertyValue('--section-stage-height'));
      // Preserve the lower half of the original centered stage's free space.
      const bottomSpace = Math.max(57, (stageHeight - contentHeight) / 2);
      section.style.setProperty('--case-bottom-space', `${bottomSpace}px`);
    });
  }

  function scheduleUpdate() {
    if (frame === undefined) frame = requestAnimationFrame(updateSpacing);
  }

  const observer = new ResizeObserver(scheduleUpdate);
  sections.forEach(section => [...section.children].forEach(child => observer.observe(child)));
  window.addEventListener('resize', scheduleUpdate);
  document.fonts.ready.then(scheduleUpdate);
  updateSpacing();
})();
