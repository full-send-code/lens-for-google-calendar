chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
	  clearInterval(readyStateCheckInterval);

	  // ----------------------------------------------------------
	  // This part of the script triggers when page is done loading
	  console.log("Hello. This message was sent from scripts/inject.js after document ready");
	  // ----------------------------------------------------------

      // insertButton()
	}
  }, 10);
});

console.log("Hello. This message was sent from scripts/inject.js");

//console.log($.fn)

console.log(CalendarManager.groups)

function insertButton(){
  var insertAfter = document
      .querySelectorAll('header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)')[0]

  var div = $.parseHTML(`
<div>
  <div>
  Calendar groups:
  </div>
  <div class='builtin' style='float:left'>
  </div>
  <div class='saved' style='float:left; margin-left: 10px'>
  </div>
</div>
`)

//  $('div.builtin', div).append(makeButton('Save', 'save'))
  $('div.builtin', div).append(makeButton('User', 'enableUser'))
  $('div.builtin', div).append(makeButton('Save As', 'saveAs'))
  $('div.builtin', div).append(makeButton('Restore', 'restore'))
  $('div.builtin', div).append(makeButton('Load', 'load'))
  $('div.builtin', div).append(makeButton('Clear', 'clear'))

  $('.save', div).click(function(){
    console.log('clicked on save button')
    CalendarManager.saveCalendarSelections()
    renderGroupButtons(div)
  })
  $('.enableUser', div).click(function(){
    console.log('clicked on enable user button')
    var user_name = prompt('Enable user by name/regex (current selection will be auto-saved)')
    if(!user_name)
      return

    CalendarManager.enableUser(user_name)
  })
  $('.saveAs', div).click(function(){
    var group_name = prompt('Save Group name')
    if(!group_name)
      return

    CalendarManager.saveCalendarSelections(group_name)
    renderGroupButtons(div)
  })
  $('.restore', div).click(function(){
    console.log('clicked on restore button')
    CalendarManager.restoreCalendarSelections()
  })
  $('.clear', div).click(function(){
    CalendarManager.saveCalendarSelections()
    CalendarManager.disableAll()
    CalendarManager.enableUser('ilya')
  })
  $('.load', div).click(function(){
    var group_name = prompt('Load group by name/regex (current selection will be auto-saved)')
    if(!group_name)
      return

    CalendarManager.saveCalendarSelections()
    CalendarManager.setGroup(group_name)
  })

  $(insertAfter).after(div)

  // append buttons for all built-in
  renderGroupButtons(div)
}

function makeButton(name, clazz){
  // clone the existin button style from the Google Calendar UI
  var todayButton = Array.from(document.querySelectorAll('div[role=button]'))
      .filter( d => d.textContent == "Today" )[0]

  var button = $(todayButton)
      .clone(false, false)
      .removeAttr(todayButton.getAttributeNames().join(' '))
      .attr({
        'class': todayButton.getAttribute('class'),
        // style: 'background:#4285f4; color:white',
      })

  $('span', button).text(name)

  if(clazz)
    $(button).addClass(clazz)

  return button
}

function renderGroupButtons(div){
  $('div.saved', div).empty()

  Object.keys(CalendarManager.groups)
    .filter(group_name => !group_name.match(/^(saved_|__)/) )
    .forEach(group_name=>{
      var button = makeButton(group_name)
      $(button).click(()=>{
        console.log('loading group', group_name, CalendarManager.groups[group_name])
        CalendarManager.setGroup(group_name)
      })
      $('div.saved', div).append(button)
    })
}

insertButton()
