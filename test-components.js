import * as SvarogCore from 'svarog-ui-core';
import MuchandyTheme from '@svarog-ui/theme-muchandy';

console.log('=== Svarog UI Core Components ===');
console.log(Object.keys(SvarogCore));

console.log('=== Muchandy Theme ===');
console.log(MuchandyTheme);
console.log('Theme properties:', Object.keys(MuchandyTheme));

// Test a component creation
if (SvarogCore.Button) {
  console.log('=== Testing Button Component ===');
  const button = SvarogCore.Button({ text: 'Test Button' });
  console.log('Button API:', Object.keys(button));
}
