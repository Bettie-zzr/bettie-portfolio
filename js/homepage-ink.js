// Preserve the original SVG geometry and fixed Figma noise at every stage.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ease = value => 1 - Math.pow(1 - value, 3);

  function prepare(host) {
    try {
      // Embedded originals work both on a website and when index.html is opened
      // directly from Finder. Local file URLs cannot reliably fetch sibling SVGs.
      const template = host.querySelector('.ink-template');
      const source = template?.content.querySelector('svg');
      if (!source) throw new Error('Missing embedded Figma SVG');
      const svg = document.importNode(source, true);
      // Exported filters share IDs. Scope them so each shape has its own noise.
      const ids = new Map();
      svg.querySelectorAll('[id]').forEach(node => {
        const original = node.id;
        const unique = `ink-${host.dataset.ink}-${ids.size}`;
        ids.set(original, unique);
        node.id = unique;
      });
      svg.querySelectorAll('*').forEach(node => {
        [...node.attributes].forEach(attribute => {
          let value = attribute.value;
          ids.forEach((unique, original) => {
            value = value.replaceAll(`url(#${original})`, `url(#${unique})`);
          });
          if (value !== attribute.value) node.setAttribute(attribute.name, value);
        });
      });
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const displacement = svg.querySelector('feDisplacementMap');
      if (!displacement) throw new Error('Missing Figma displacement filter');
      const finalScale = Number(displacement.getAttribute('scale'));
      displacement.setAttribute('scale', '0');
      const art = document.createElement('span');
      art.className = 'ink-art';
      art.setAttribute('aria-hidden', 'true');
      art.append(svg);
      host.prepend(art);
      host.classList.add('ink-ready');

      const trigger = host.querySelector('.ink-trigger') || host;
      const original = host.querySelector('.hero-border__default, .flower-link__default');
      const copy = host.dataset.ink === 'hero' ? document.querySelector('.hero-copy') : null;
      const reveal = host.querySelector('.hero-reveal, .flower-reveal');
      reveal.setAttribute('aria-hidden', 'true');
      const area = host.closest('.hero-interaction') || host;
      let active = false;
      let pointerInside = false;
      let keyboardInside = false;
      let frameID = 0;
      let fillValue = 0;
      let bleedValue = 0;

      function paint(fill, bleed) {
        fillValue = fill;
        bleedValue = bleed;
        art.style.opacity = fill;
        original.style.opacity = 1 - fill;
        if (copy) {
          copy.style.opacity = 1 - fill;
          copy.style.filter = `blur(${4 * fill}px)`;
        }
        displacement.setAttribute('scale', String(finalScale * bleed));
      }

      function play() {
        if (active) return;
        active = true;
        cancelAnimationFrame(frameID);
        trigger.setAttribute('aria-expanded', 'true');
        host.classList.remove('is-ink-resetting');
        host.classList.add('is-ink-playing');
        copy?.classList.add('is-ink-filling');
        const start = performance.now();
        const initialFill = fillValue;
        const initialBleed = bleedValue;
        function frame(now) {
          const elapsed = now - start;
          const fill = reducedMotion.matches ? 1 : initialFill + (1 - initialFill) * ease(Math.min(elapsed / 300, 1));
          const bleed = reducedMotion.matches ? 1 : initialBleed + (1 - initialBleed) * ease(Math.max(0, Math.min((elapsed - 300) / 850, 1)));
          paint(fill, bleed);
          if (fill === 1) {
            host.classList.add('is-ink-filled');
            reveal.removeAttribute('aria-hidden');
          }
          if (bleed < 1) frameID = requestAnimationFrame(frame);
          else {
            host.classList.remove('is-ink-playing');
            host.classList.add('is-ink-revealed');
            displacement.setAttribute('scale', String(finalScale));
          }
        }
        frameID = requestAnimationFrame(frame);
      }

      function reset() {
        if (!active || pointerInside || keyboardInside) return;
        active = false;
        cancelAnimationFrame(frameID);
        trigger.setAttribute('aria-expanded', 'false');
        host.classList.add('is-ink-resetting');
        host.classList.remove('is-ink-playing', 'is-ink-filled', 'is-ink-revealed');
        reveal.setAttribute('aria-hidden', 'true');
        const initialFill = fillValue;
        const initialBleed = bleedValue;
        const start = performance.now();
        function frame(now) {
          const elapsed = now - start;
          // Settle the grain back into a solid contour before restoring the pale fill.
          const edge = reducedMotion.matches ? 1 : Math.min(elapsed / 650, 1);
          const fill = reducedMotion.matches ? 1 : Math.max(0, Math.min((elapsed - 450) / 450, 1));
          paint(initialFill * (1 - ease(fill)), initialBleed * (1 - ease(edge)));
          if (fill < 1) frameID = requestAnimationFrame(frame);
          else {
            paint(0, 0);
            host.classList.remove('is-ink-resetting');
            copy?.classList.remove('is-ink-filling');
          }
        }
        frameID = requestAnimationFrame(frame);
      }

      area.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        pointerInside = true;
        play();
      });
      area.addEventListener('pointerleave', () => {
        pointerInside = false;
        reset();
      });
      area.addEventListener('focusin', event => {
        // Mouse clicks must not latch the hover state after the pointer leaves.
        if (!event.target.matches(':focus-visible')) return;
        keyboardInside = true;
        play();
      });
      area.addEventListener('focusout', event => {
        if (event.relatedTarget && area.contains(event.relatedTarget)) return;
        keyboardInside = false;
        reset();
      });
      area.addEventListener('pointerup', event => {
        if (event.pointerType === 'touch' && !event.target.closest('a')) play();
      });
      trigger.addEventListener('keydown', event => {
        if (event.target !== trigger) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          keyboardInside = true;
          play();
        }
      });
      // Handle a pointer already over the shape when its SVG finishes loading.
      if (area.matches(':hover')) {
        pointerInside = true;
        play();
      }
    } catch (error) {
      host.classList.add('ink-fallback');
      host.querySelector('.flower-reveal')?.removeAttribute('aria-hidden');
      console.warn('Ink reveal unavailable; keeping the project fallback.', error);
    }
  }
  document.querySelectorAll('[data-ink]').forEach(prepare);
})();
