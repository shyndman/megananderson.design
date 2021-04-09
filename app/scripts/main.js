(() => {
  const hasIntersectionObserver = 'IntersectionObserver' in window;
  let intersectionObserver;
  if (hasIntersectionObserver) {
    intersectionObserver = new IntersectionObserver(
      (entries, _) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const img = entry.target;
          if (!img.classList.contains('is-in-view')) {
            img.classList.add('is-in-view');
          }
        }
      },
      {
        threshold: 0.3,
      },
    );
  }

  for (const img of Array.from(document.querySelectorAll('img'))) {
    if (!hasIntersectionObserver) {
      img.classList.add('is-in-view');
    } else {
      intersectionObserver.observe(img);
    }

    if (img.complete) {
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
