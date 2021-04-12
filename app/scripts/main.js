(() => {
  window.addEventListener('load', () => {
    // Fade-in the entire page
    document.body.classList.add('ready');
  });

  // Set up intersection observation, so that images fade-in while the user is
  // scrolling
  const hasIntersectionObserver = 'IntersectionObserver' in window;
  let intersectionObserver;
  if (hasIntersectionObserver) {
    intersectionObserver = new IntersectionObserver(
      (entries, _) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const target = entry.target;
          if (!target.classList.contains('is-in-view')) {
            target.classList.add('is-in-view');
          }
        }
      },
      {
        // Feels about right
        threshold: 0.3,
      },
    );
  }

  // Set up images for the scroll fade-ins
  for (const img of Array.from(document.querySelectorAll('img, .portfolio-highlight .copy'))) {
    if (!hasIntersectionObserver) {
      img.classList.add('is-in-view');
    } else {
      intersectionObserver.observe(img);
    }

    if (img instanceof HTMLImageElement && img.complete) {
      markImageLoaded(img);
    } else {
      img.addEventListener('load', (event) => {
        markImageLoaded(event.target);
      });
    }
  }

  function markImageLoaded(img) {
    img.classList.add('is-loaded');
  }
})();
