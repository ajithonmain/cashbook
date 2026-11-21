// Runs before first paint (loaded as a blocking external script because the CSP forbids inline scripts)
// so the saved or system theme is applied without a flash of the wrong colors.
(function () {
  var pref = "system";
  try {
    pref = localStorage.getItem("cashbook_theme") || "system";
  } catch (e) {}
  var dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0D0F10" : "#F5F5F7");
})();
