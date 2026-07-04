(function () {
  const form = document.querySelector('form[name="enquiry"]');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const keys = ['source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

  keys.forEach(function (key) {
    const input = form.querySelector('[name="' + key + '"]');
    if (input) input.value = params.get(key) || sessionStorage.getItem('apl_' + key) || '';
    if (params.get(key)) sessionStorage.setItem('apl_' + key, params.get(key));
  });

  const landing = form.querySelector('[name="landing_page"]');
  let inferredLanding = window.location.pathname;
  if (document.referrer) {
    try {
      const previous = new URL(document.referrer);
      inferredLanding = previous.origin === window.location.origin ? previous.pathname : previous.hostname;
    } catch (_) {}
  }
  if (landing) landing.value = sessionStorage.getItem('apl_landing') || inferredLanding;

  const referrer = form.querySelector('[name="referrer"]');
  if (referrer) referrer.value = document.referrer || '';
})();
