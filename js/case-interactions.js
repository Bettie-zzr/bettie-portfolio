// Horizontal cards respond to hover; stacked decisions follow the reading position.
(() => {
  function number(label) {
    if (!label) return;
    const match = label.textContent.match(/^(\s*)(\d{2})([\s\S]*)$/);
    if (!match) return;
    if (!match[3].trim()) {
      label.classList.add('case-accent-number');
    } else {
      // Some existing labels wrap only their number; normalize without recolouring titles.
      const span = document.createElement('span');
      span.className = 'case-accent-number';
      span.textContent = match[2];
      label.replaceChildren(document.createTextNode(match[1]), span, document.createTextNode(match[3]));
    }
  }

  document.querySelectorAll('.approach-step, .urt-card, .wego-cycle, .wego-statistic, .wego-finding').forEach(card => {
    card.dataset.caseHover = '';
    const line = card.matches('.wego-cycle') ? card.querySelector('.decision-note__heading') : card;
    line?.classList.add('case-accent-line');
    number(card.querySelector('.approach-step__number, .wego-label, .decision-note__heading p'));
  });

  // Each horizontal group starts with 01 highlighted, and returns to it on exit.
  const horizontalGroups = new Map();
  document.querySelectorAll('[data-case-hover]').forEach(card => {
    const cards = horizontalGroups.get(card.parentElement) || [];
    cards.push(card);
    horizontalGroups.set(card.parentElement, cards);
  });
  horizontalGroups.forEach((cards, group) => {
    const select = current => cards.forEach(card => card.classList.toggle('is-case-hover', card === current));
    const restore = () => select(cards.find(card => card.matches(':hover, :focus-within')) || cards[0]);
    cards.forEach(card => {
      card.addEventListener('pointerenter', () => select(card));
      card.addEventListener('focusin', () => select(card));
    });
    group.addEventListener('pointerleave', () => select(cards.find(card => card.matches(':focus-within')) || cards[0]));
    group.addEventListener('focusout', () => requestAnimationFrame(restore));
    restore();
  });

  const sections = new Map();
  document.querySelectorAll('.decision-group, .wego-decision-group').forEach(group => {
    group.querySelector('.decision-note__heading')?.classList.add('case-accent-line');
    number(group.querySelector('.decision-note__heading p'));
    const siblings = sections.get(group.parentElement) || [];
    siblings.push(group);
    sections.set(group.parentElement, siblings);
  });
  if (!sections.size) return;

  let scheduled = false;
  function update() {
    scheduled = false;
    const readingLine = window.innerHeight * 0.35;
    sections.forEach(groups => {
      let current = null;
      let closest = Infinity;
      groups.forEach(group => {
        const rect = group.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= window.innerHeight * 0.8) return;
        const distance = rect.top <= readingLine && rect.bottom > readingLine
          ? 0 : Math.min(Math.abs(rect.top - readingLine), Math.abs(rect.bottom - readingLine));
        if (distance < closest) { closest = distance; current = group; }
      });
      groups.forEach(group => group.classList.toggle('is-case-reading', group === current));
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  document.addEventListener('load', schedule, true);
  update();
})();
