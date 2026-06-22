const KEY = "aether.favorites";
const idOf = p => `${Number(p.lat).toFixed(2).replace(/0$/,'').replace(/\.$/,'')},${Number(p.lon).toFixed(2).replace(/0$/,'').replace(/\.$/,'')}`;
export function makeFavorites(storage) {
  const read = () => JSON.parse(storage.getItem(KEY) || "[]");
  const write = arr => storage.setItem(KEY, JSON.stringify(arr));
  return {
    list: () => read(),
    has: id => read().some(p => idOf(p) === id),
    add(p) { const arr = read(); if (!arr.some(x => idOf(x) === idOf(p))) { arr.push(p); write(arr); } },
    remove(id) { write(read().filter(p => idOf(p) !== id)); }
  };
}
export { idOf };
