// Re-export Svarog UI utilities
export {
  createElement,
  createComponent,
  validateProps,
  appendChildren,
} from 'svarog-ui-core';

export const normalizeProps = (props) => {
  const normalized = { ...props };

  // Handle legacy prop names
  if ('isDisabled' in props && !('disabled' in props)) {
    normalized.disabled = props.isDisabled;
  }

  if ('isLoading' in props && !('loading' in props)) {
    normalized.loading = props.isLoading;
  }

  if ('cssClass' in props && !('className' in props)) {
    normalized.className = props.cssClass;
  }

  return normalized;
};
