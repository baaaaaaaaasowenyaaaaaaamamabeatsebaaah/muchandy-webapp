/**
 * CSS injection utility for Svarog components
 */
const injectedStyles = new Set();

export const css = (strings, ...values) => {
  return strings.reduce((result, string, i) => {
    const value = values[i] ? values[i] : '';
    return result + string + value;
  }, '');
};

export const createStyleInjector = (componentName) => {
  return (styles) => {
    const styleId = `svarog-${componentName.toLowerCase()}`;

    if (injectedStyles.has(styleId)) {
      return; // Already injected
    }

    if (typeof document === 'undefined') {
      return; // SSR safe
    }

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    injectedStyles.add(styleId);
  };
};

export const injectThemeStyles = (themeName, styles) => {
  if (typeof document === 'undefined') return;

  const existingTheme = document.getElementById(`theme-${themeName}`);
  if (existingTheme) {
    existingTheme.remove();
  }

  const styleElement = document.createElement('style');
  styleElement.id = `theme-${themeName}`;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
};

export const removeThemeStyles = (themeName) => {
  if (typeof document === 'undefined') return;

  const themeElement = document.getElementById(`theme-${themeName}`);
  if (themeElement) {
    themeElement.remove();
  }
};
