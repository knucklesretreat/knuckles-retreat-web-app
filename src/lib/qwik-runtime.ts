// Reproduces how the Qwik site scheduled and rendered its client code, so component scripts can be
// ported line for line from their `useVisibleTask$` bodies (docs/astro-migration-plan.md §4.4).

/** `useVisibleTask$` default strategy: runs once, the first time `el` intersects the viewport. */
export function onVisible(el: Element, fn: () => void): void {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        fn();
      }
    }
  });
  observer.observe(el);
}

/** `strategy: 'document-idle'`. (`'document-ready'` needs no helper: module scripts run then.) */
export function onIdle(fn: () => void): void {
  (window.requestIdleCallback ?? window.setTimeout).call(window, () => fn());
}

type ClassValue =
  | string
  | undefined
  | null
  | false
  | ClassValue[]
  | Record<string, unknown>;

/** Qwik's class serialization: empty entries dropped, objects contribute keys with truthy values. */
export function cx(...parts: ClassValue[]): string {
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (typeof part === "string") {
      if (part.trim()) out.push(part.trim());
    } else if (Array.isArray(part)) {
      const s = cx(...part);
      if (s) out.push(s);
    } else {
      for (const [key, value] of Object.entries(part))
        if (value) out.push(key.trim());
    }
  }
  return out.join(" ");
}

type Prop = "class" | "style" | "disabled" | "value";

/**
 * Qwik re-rendered state-bound props on the next macrotask (its client scheduler is setTimeout) and
 * wrote a prop only if it differed from the value it last rendered. A changed `class`/`style`
 * replaced the whole value, wiping classes or inline styles set directly by other code — some
 * behaviour depends on that, so ports bind those props here instead of touching the DOM directly.
 * Tasks that tracked state re-ran after the render, which is what `afterRender` callbacks are for.
 */
export function createRenderer() {
  const bindings: {
    el: HTMLElement;
    prop: Prop;
    compute: () => unknown;
    last: unknown;
  }[] = [];
  const afterRender: (() => void)[] = [];
  let scheduled = false;

  const apply = (el: HTMLElement, prop: Prop, value: unknown) => {
    if (prop === "class") el.className = String(value);
    else if (prop === "style") el.style.cssText = String(value);
    else if (prop === "disabled")
      (el as HTMLButtonElement).disabled = Boolean(value);
    else if ((el as HTMLInputElement).value !== value)
      (el as HTMLInputElement).value = String(value);
  };

  const flush = () => {
    scheduled = false;
    for (const b of bindings) {
      const value = b.compute();
      if (value !== b.last) {
        b.last = value;
        apply(b.el, b.prop, value);
      }
    }
    for (const fn of afterRender) fn();
  };

  return {
    /** `compute` must return what the server rendered for the initial state. */
    bind(el: HTMLElement, prop: Prop, compute: () => unknown) {
      bindings.push({ el, prop, compute, last: compute() });
    },
    afterRender(fn: () => void) {
      afterRender.push(fn);
    },
    /** Call after changing state, like assigning to a Qwik signal. */
    invalidate() {
      if (scheduled) return;
      scheduled = true;
      setTimeout(flush);
    },
  };
}

/**
 * A task that tracks values: `start()` runs it (at the task's strategy time); afterwards `check()`
 * re-runs it — after the previous run's cleanup — whenever any tracked value changed.
 */
export function createTask(
  track: () => unknown[],
  fn: () => (() => void) | void,
) {
  let started = false;
  let last: unknown[] = [];
  let cleanup: (() => void) | void;
  const run = () => {
    cleanup?.();
    last = track();
    cleanup = fn();
  };
  return {
    start() {
      started = true;
      run();
    },
    check() {
      if (!started) return;
      const now = track();
      if (now.some((v, i) => !Object.is(v, last[i]))) run();
    },
  };
}

/**
 * Qwik City's `useNavigate()(path)` as this site used it. Navigating to the current path and query
 * doesn't reload: it pushes the URL if it differs and scrolls to the top. Anything else is a page
 * navigation (Qwik's was client-side; the visible result is the same page).
 */
export function navigate(path: string): void {
  const dest = new URL(path, location.href);
  if (dest.pathname === location.pathname && dest.search === location.search) {
    if (dest.href !== location.href) history.pushState(null, "", dest);
    window.scrollTo(0, 0);
    return;
  }
  location.href = dest.href;
}
