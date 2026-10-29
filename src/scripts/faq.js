// Answers open and close with an eased height, one at a time.
export function initFaq({ gsap, reduce }) {
  const items = [...document.querySelectorAll('.faq-item')];
  const duration = reduce ? 0 : 0.5;

  function close(item) {
    const body = item.querySelector('.faq-a');
    item.classList.remove('is-open');
    gsap.to(body, {
      height: 0,
      opacity: 0,
      duration: duration * 0.8,
      ease: 'expo.inOut',
      overwrite: true,
      onComplete: () => {
        item.open = false;
        gsap.set(body, { clearProps: 'height,opacity' });
      },
    });
  }
  function open(item) {
    const body = item.querySelector('.faq-a');
    item.open = true;
    item.classList.add('is-open');
    gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration, ease: 'expo.out', overwrite: true });
  }

  items.forEach((item) => {
    // The exclusive grouping is done here, so it can animate.
    item.removeAttribute('name');
    item.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (item.classList.contains('is-open')) {
        close(item);
        return;
      }
      items.filter((i) => i !== item && i.classList.contains('is-open')).forEach(close);
      open(item);
    });
  });
}
