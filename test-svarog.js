// Test Svarog UI packages are working correctly
import { Button, Card, createElement, ThemeManager } from 'svarog-ui-core';
import MuchandyTheme from '@svarog-ui/theme-muchandy';

console.log('=== Testing Svarog UI Packages ===\n');

try {
  // Test 1: Component imports
  console.log('✅ Components imported successfully');
  console.log('   - Button:', typeof Button);
  console.log('   - Card:', typeof Card);
  console.log('   - createElement:', typeof createElement);
  console.log('   - ThemeManager:', typeof ThemeManager);

  // Test 2: Theme import
  console.log('\n✅ Muchandy theme imported successfully');
  console.log('   - Theme methods:', Object.keys(MuchandyTheme));

  // Test 3: Create components (Node.js safe)
  const button = Button({ text: 'Test Button' });
  console.log('\n✅ Button created successfully');
  console.log('   - Button API:', Object.keys(button));

  const card = Card({
    title: 'Test Card',
    description: 'Testing Svarog UI',
  });
  console.log('\n✅ Card created successfully');
  console.log('   - Card API:', Object.keys(card));

  // Test 4: Check theme manager
  if (ThemeManager && ThemeManager.load) {
    console.log('\n✅ ThemeManager available with load method');
  }

  console.log('\n🎉 All Svarog UI tests passed!\n');
  console.log('Package versions:');
  console.log('- svarog-ui-core: 2.3.0');
  console.log('- @svarog-ui/theme-muchandy: 1.5.0');
} catch (error) {
  console.error('\n❌ Svarog UI test failed:', error);
  process.exit(1);
}
