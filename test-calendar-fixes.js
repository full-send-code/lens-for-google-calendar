/**
 * Final test script to verify the calendar toggle fixes
 * Run this in the browser console on Google Calendar after loading the extension
 */

console.log('=== Calendar Toggle Fix Test ===');

// Test 1: Verify calendar detection using the original selector
console.log('\n1. Testing calendar detection...');
const calendars = document.querySelectorAll("div[role='list'] li[role='listitem']");
console.log(`✓ Found ${calendars.length} calendar elements`);

if (calendars.length === 0) {
  console.log('❌ No calendars found - Google Calendar UI may have changed');
  console.log('Trying alternative selectors...');
  
  const alternativeSelectors = [
    '.calendar-list li',
    "[data-is-list='true'] [role='listitem']",
    'aside [role="listitem"]'
  ];
  
  for (const selector of alternativeSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with: ${selector}`);
      break;
    }
  }
} else {
  console.log('✓ Calendar detection working');
}

// Test 2: Verify DOM structure matches expectations
console.log('\n2. Testing DOM structure...');
let structureValid = true;

calendars.forEach((cal, index) => {
  const divChild = cal.querySelector('div');
  const checkbox = cal.querySelector('input[type="checkbox"]');
  
  if (!divChild || !checkbox) {
    console.log(`❌ Calendar ${index + 1}: Missing required structure - div: ${!!divChild}, checkbox: ${!!checkbox}`);
    structureValid = false;
  } else {
    const dataId = divChild.getAttribute('data-id');
    const ariaLabel = checkbox.getAttribute('aria-label');
    
    console.log(`✓ Calendar ${index + 1}: Structure OK`);
    console.log(`  - data-id: ${dataId ? 'present' : 'missing'}`);
    console.log(`  - aria-label: ${ariaLabel ? `"${ariaLabel}"` : 'missing'}`);
    console.log(`  - checked: ${checkbox.checked}`);
    
    if (dataId) {
      try {
        const decoded = atob(dataId);
        console.log(`  - decoded ID: ${decoded}`);
      } catch (e) {
        console.log(`  - decode failed: ${e.message}`);
      }
    }
  }
});

if (structureValid && calendars.length > 0) {
  console.log('✓ DOM structure matches expectations');
} else {
  console.log('❌ DOM structure issues detected');
}

// Test 3: Test toggle mechanism (simulate without actually clicking)
console.log('\n3. Testing toggle mechanism...');
if (calendars.length > 0) {
  const testCal = calendars[0];
  const divChild = testCal.querySelector('div');
  const checkbox = testCal.querySelector('input[type="checkbox"]');
  
  if (divChild && checkbox) {
    console.log('✓ Toggle target (div) found');
    console.log(`  - Current state: ${checkbox.checked ? 'checked' : 'unchecked'}`);
    console.log('  - Ready for toggle via div.click()');
    
    // Store a reference for manual testing
    window.testCalendarDiv = divChild;
    window.testCalendarCheckbox = checkbox;
    console.log('  - Test elements stored in window.testCalendarDiv and window.testCalendarCheckbox');
  } else {
    console.log('❌ Toggle mechanism not ready');
  }
}

// Test 4: Verify drawer detection
console.log('\n4. Testing drawer detection...');
try {
  const drawerNavigator = document.querySelector('div#drawerMiniMonthNavigator');
  if (drawerNavigator) {
    const scrollContainer = drawerNavigator.parentElement;
    const isVisible = scrollContainer?.offsetParent !== null;
    console.log(`✓ Found drawerMiniMonthNavigator, visible: ${isVisible}`);
  } else {
    console.log('⚠️  drawerMiniMonthNavigator not found, trying fallback');
    const drawer = document.querySelector('.drawer');
    if (drawer) {
      const isVisible = getComputedStyle(drawer).display !== 'none';
      console.log(`✓ Found .drawer, visible: ${isVisible}`);
    } else {
      console.log('❌ No drawer elements found');
    }
  }
} catch (e) {
  console.log(`❌ Drawer detection error: ${e.message}`);
}

// Test 5: Extension integration test
console.log('\n5. Testing extension integration...');
if (window.CalendarManager) {
  console.log('✓ CalendarManager is available');
  
  if (window.CalendarManager.calendars) {
    console.log(`✓ CalendarManager has ${window.CalendarManager.calendars.length} calendars`);
    
    // Test a calendar method
    if (window.CalendarManager.calendars.length > 0) {
      const firstCal = window.CalendarManager.calendars[0];
      console.log(`✓ First calendar: "${firstCal.name}" (${firstCal.id})`);
      console.log(`  - Attached: ${firstCal.attached}`);
      console.log(`  - Checked: ${firstCal.isChecked()}`);
    }
  } else {
    console.log('❌ CalendarManager.calendars is not initialized');
  }
} else {
  console.log('❌ CalendarManager not found - extension may not be loaded or initialized');
}

// Test 6: Manual test instructions
console.log('\n6. Manual testing:');
console.log('To test actual toggling:');
console.log('  1. Run: window.testCalendarDiv.click()');
console.log('  2. Check if the checkbox state changed');
console.log('  3. Or use: window.CalendarManager.calendars[0].toggle()');

console.log('\n=== Test Complete ===');
console.log('Summary:');
console.log(`- Calendars found: ${calendars.length}`);
console.log(`- Structure valid: ${structureValid}`);
console.log(`- Extension loaded: ${!!window.CalendarManager}`);

if (calendars.length > 0 && structureValid && window.CalendarManager) {
  console.log('🎉 All basic tests passed! The fixes should be working.');
} else {
  console.log('⚠️  Some issues detected. Check the details above.');
}
