import {
  ENGINE_READY_ATTRIBUTE,
  SCRIPT_RUNNING_CLASS,
  TERMINAL_ON_CLASS,
} from '@/components/Terminal/constants'
import { THEME_STORAGE_KEY } from '@/components/themeColor'

/**
 * How long the terminal's first screen may wait for its script. After this a slow or failed
 * script cannot strand a visitor on one screen: the page falls back to the plain flow, which is
 * all there in the HTML.
 */
const TERMINAL_FAILSAFE_MILLISECONDS = 6000

/**
 * Runs before the first paint, so a visitor sees neither the wrong theme nor a flash of every
 * section stacked up.
 *
 * Theme: dark for everyone, whatever the system prefers, unless a stored choice says otherwise.
 * Terminal: on, unless the visitor asks for reduced motion. It only marks `<html>`, so a page
 * with no terminal is not changed by it. If the script never runs, the plain flow stands.
 */
export const PRE_PAINT_SCRIPT = `(function () {
  var html = document.documentElement;
  var storedTheme = null;
  try {
    storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}');
  } catch (error) {
    console.warn('The stored theme could not be read', error);
  }
  if (storedTheme !== 'light') {
    html.classList.add('dark');
  }
  html.classList.add('${SCRIPT_RUNNING_CLASS}');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  html.classList.add('${TERMINAL_ON_CLASS}');
  setTimeout(function () {
    if (!document.querySelector('[${ENGINE_READY_ATTRIBUTE}]')) {
      html.classList.remove('${TERMINAL_ON_CLASS}', '${SCRIPT_RUNNING_CLASS}');
    }
  }, ${TERMINAL_FAILSAFE_MILLISECONDS});
})();`
