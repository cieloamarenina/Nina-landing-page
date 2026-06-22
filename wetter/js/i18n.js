export function pickLang(navLang, available) {
  const primary = (navLang || "en").toLowerCase().split("-")[0];
  return available.includes(primary) ? primary : "en";
}
export function translator(dict) {
  return (key, vars = {}) => {
    let s = dict[key];
    if (s == null) return key;
    return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  };
}
export async function loadDict(lang) {
  const res = await fetch(`i18n/${lang}.json`);
  return res.json();
}
