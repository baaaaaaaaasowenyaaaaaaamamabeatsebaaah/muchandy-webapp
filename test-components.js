// Test the published packages (Node.js environment)
console.log('=== Testing Published Svarog UI Packages ===\n');

async function testPackages() {
  try {
    // Test svarog-ui (all-in-one)
    console.log('1. Testing svarog-ui...');
    const SvarogUI = await import('svarog-ui');
    console.log('✅ svarog-ui loaded');
    console.log(
      '   Available exports:',
      Object.keys(SvarogUI).length,
      'exports found'
    );

    // Test svarog-ui-core
    console.log('\n2. Testing svarog-ui-core...');
    const SvarogCore = await import('svarog-ui-core');
    console.log('✅ svarog-ui-core loaded');
    console.log(
      '   Available exports:',
      Object.keys(SvarogCore).length,
      'exports found'
    );

    // Test theme
    console.log('\n3. Testing @svarog-ui/theme-muchandy...');
    const MuchandyTheme = await import('@svarog-ui/theme-muchandy');
    console.log('✅ @svarog-ui/theme-muchandy loaded');
    console.log(
      '   Theme object:',
      MuchandyTheme.default ? 'Found default export' : 'No default export'
    );

    // Check key exports
    console.log('\n4. Checking key exports...');
    const requiredExports = [
      'Button',
      'Card',
      'Form',
      'Input',
      'Select',
      'createElement',
      'ThemeManager',
      'loadTheme',
    ];

    const missingExports = requiredExports.filter((exp) => !SvarogUI[exp]);
    if (missingExports.length === 0) {
      console.log('✅ All required exports found');
    } else {
      console.log('⚠️  Missing exports:', missingExports);
    }

    // Check component factory functions
    console.log('\n5. Checking component types...');
    console.log('   Button is a', typeof SvarogUI.Button);
    console.log('   Card is a', typeof SvarogUI.Card);
    console.log('   ThemeManager is a', typeof SvarogUI.ThemeManager);

    console.log('\n🎉 All package imports successful!');
    console.log(
      '\n💡 Note: Component creation requires a browser environment.'
    );
    console.log('   Run "npm run dev" and check the browser test.');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testPackages();
