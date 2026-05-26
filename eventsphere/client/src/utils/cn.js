/**
 * Conditionally joins classNames together
 * @param  {...any} classes - List of classes or expressions
 * @returns {String} - Merged class string
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
