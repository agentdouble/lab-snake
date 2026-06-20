const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function createSettingsMenu(options) {
  const {
    layer,
    panel,
    backdrop,
    openButton,
    closeButton,
    gridToggle,
    settings,
    onOpen = () => {},
    onClose = () => {},
    onSettingsChange = () => {}
  } = options;

  let open = false;
  let previousFocus = null;
  let currentSettings = { ...settings };

  gridToggle.checked = currentSettings.showGrid;

  function openMenu() {
    if (open) {
      return;
    }

    previousFocus = document.activeElement;
    open = true;
    layer.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
    onOpen();
    window.requestAnimationFrame(() => panel.focus());
  }

  function closeMenu() {
    if (!open) {
      return;
    }

    open = false;
    layer.hidden = true;
    openButton.setAttribute("aria-expanded", "false");
    onClose();

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
  }

  function updateSettings(nextSettings) {
    currentSettings = {
      ...currentSettings,
      ...nextSettings
    };
    gridToggle.checked = currentSettings.showGrid;
    onSettingsChange({ ...currentSettings });
  }

  openButton.addEventListener("click", openMenu);
  closeButton.addEventListener("click", closeMenu);
  backdrop.addEventListener("click", closeMenu);
  gridToggle.addEventListener("change", () => updateSettings({ showGrid: gridToggle.checked }));

  window.addEventListener("keydown", (event) => {
    if (!open) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab") {
      keepFocusInPanel(event, panel);
    }
  });

  return {
    open: openMenu,
    close: closeMenu,
    isOpen() {
      return open;
    },
    getSettings() {
      return { ...currentSettings };
    }
  };
}

function keepFocusInPanel(event, panel) {
  const focusableElements = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetParent !== null
  );

  if (focusableElements.length === 0) {
    event.preventDefault();
    panel.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}
