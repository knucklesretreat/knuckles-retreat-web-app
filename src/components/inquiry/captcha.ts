// The inquiry form's CAPTCHA, kept in one module so replacing reCAPTCHA (Phase 6) is a one-file change.
// reCAPTCHA v2 checkbox: api.js (loaded async in BaseLayout) auto-renders `div.g-recaptcha`.

interface ReCaptcha {
  ready(callback: () => void): void;
  render(container: string, parameters: { sitekey: string }): number;
  getResponse(widgetId?: number): string;
  reset(widgetId?: number): void;
}

declare global {
  interface Window {
    grecaptcha?: ReCaptcha;
  }
}

const SITE_KEY = "6LfqVD4pAAAAAByXb5ErD4k81KielZ8Ybz4PRw8K";

/**
 * Renders the widget if api.js didn't auto-render it, like the Qwik page's guarded
 * `grecaptcha.render` — but waits for api.js (which finishes before the window `load` event) instead
 * of assuming it has already run.
 */
export function ensureRendered(): void {
  const render = () => {
    const recaptchaResElement = document.getElementById("g-recaptcha-response");
    if (
      recaptchaResElement &&
      recaptchaResElement.classList.contains("g-recaptcha-response")
    ) {
      return;
    }
    window.grecaptcha!.render("kr-g-recaptcha", { sitekey: SITE_KEY });
  };
  const whenReady = () => window.grecaptcha?.ready(render);
  if (document.readyState === "complete") whenReady();
  else window.addEventListener("load", whenReady, { once: true });
}

export async function getToken(): Promise<string> {
  return window.grecaptcha!.getResponse();
}

export function reset(): void {
  window.grecaptcha!.reset();
}
