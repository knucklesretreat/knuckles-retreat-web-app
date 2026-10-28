// Client side of src/components/ScriptData.astro.
export function readScriptData<T>(name: string): T {
  const el = document.querySelector(`script[data-script-data="${name}"]`);
  if (!el?.textContent) throw new Error(`Missing script data "${name}"`);
  return JSON.parse(el.textContent) as T;
}

export type Classes = Record<string, string>;
