export function uniqueName(prefix, objlist) {
  const names = objlist.map(({name}) => name);
  let candidate;
  let taken = true;
  let suffix = names.length;
  while (taken) {
    candidate = prefix + suffix;
    taken = names.indexOf(candidate) !== -1;
    suffix++;
  }
  return candidate;
}
