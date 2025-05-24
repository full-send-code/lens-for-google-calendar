/**
 * Debug script to test calendar detection and toggling functionality
 * Run this in the browser console on Google Calendar to test the fixes
 */

console.log('=== Calendar Detection Debug Script ===');

// Test 1: Find calendar list elements using the original working selector
console.log('\n1. Testing calendar list detection...');
const calendars = document.querySelectorAll("div[role='list'] li[role='listitem']");
console.log(`Found ${calendars.length} calendar elements using original selector`);

if (calendars.length === 0) {
  console.log('Trying fallback selectors...');
  const fallbacks = [
    ".calendar-list li",
    "[data-is-list='true'] [role='listitem']",
    "[data-is-list='true'] li",
    ".cal-sidebar li",
    "aside [role='listitem']"
  ];
  
  for (const selector of fallbacks) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} calendar elements using fallback: ${selector}`);
      break;
    }
  }
}

// Test 2: Analyze the structure of each calendar element
console.log('\n2. Analyzing calendar element structure...');
calendars.forEach((cal, index) => {
  console.log(`\nCalendar ${index + 1}:`);
  
  // Check for div child (label element)
  const divChild = cal.querySelector('div');
  if (divChild) {
    const dataId = divChild.getAttribute('data-id');
    console.log(`  - Found div child with data-id: ${dataId}`);
    if (dataId) {
      try {
        const decodedId = atob(dataId);
        console.log(`  - Decoded ID: ${decodedId}`);
      } catch (e) {
        console.log(`  - Could not decode data-id: ${e.message}`);
      }
    }
  } else {
    console.log('  - No div child found');
  }
  
  // Check for checkbox
  const checkbox = cal.querySelector('input[type="checkbox"]');
  if (checkbox) {
    const ariaLabel = checkbox.getAttribute('aria-label');
    console.log(`  - Found checkbox with aria-label: "${ariaLabel}"`);
    console.log(`  - Checkbox checked state: ${checkbox.checked}`);
    console.log(`  - Checkbox value: "${checkbox.value}"`);
  } else {
    console.log('  - No input[type="checkbox"] found');
  }
  
  // Show all child elements for debugging
  console.log(`  - Child elements:`, Array.from(cal.children).map(child => `${child.tagName}${child.className ? '.' + child.className : ''}`));
});

// Test 3: Test the calendar drawer detection
console.log('\n3. Testing calendar drawer detection...');

// Original method
try {
  const drawerNavigator = document.querySelector('div#drawerMiniMonthNavigator');
  if (drawerNavigator) {
    const scrollContainer = drawerNavigator.parentElement;
    console.log(`Found drawerMiniMonthNavigator, scroll container visible: ${scrollContainer?.offsetParent !== null}`);
  } else {
    console.log('drawerMiniMonthNavigator not found');
  }
} catch (e) {
  console.log(`Error checking drawerMiniMonthNavigator: ${e.message}`);
}

// Fallback method
const drawer = document.querySelector('.drawer');
if (drawer) {
  console.log(`Found .drawer element, display: ${getComputedStyle(drawer).display}`);
} else {
  console.log('No .drawer element found');
}

// Test 4: Test toggle functionality (without actually clicking)
console.log('\n4. Testing toggle target identification...');
calendars.forEach((cal, index) => {
  const divChild = cal.querySelector('div');
  const checkbox = cal.querySelector('input[type="checkbox"]');
  
  if (divChild && checkbox) {
    console.log(`Calendar ${index + 1}: Ready for toggle (found both div and checkbox)`);
  } else {
    console.log(`Calendar ${index + 1}: Missing elements - div: ${!!divChild}, checkbox: ${!!checkbox}`);
  }
});

// Test 5: Show current visible structure
console.log('\n5. Current DOM structure sample:');
if (calendars.length > 0) {
  console.log('First calendar element structure:');
  console.log(calendars[0].outerHTML);
}

console.log('\n=== Debug Script Complete ===');
console.log('If you want to test actual toggling, run: calendars[0].querySelector("div").click() (replace 0 with desired calendar index)');
