if(chrome && chrome.extension){
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
}
console.log(window.CalendarManager && CalendarManager.groups)

var snackbar
function insertButton(insertLoc){
  $('head').append(
    $('<link rel="stylesheet" type="text/css" />').attr('href', "https://fonts.googleapis.com/icon?family=Material+Icons")
  )

  snackbar = $.parseHTML(`
    <div id="snackbar" class="mdl-js-snackbar mdl-snackbar">
      <div class="mdl-snackbar__text"></div>
    <button class="mdl-snackbar__action" type="button"></button>
  `)[1]
  componentHandler.upgradeElements(snackbar)
  $('body').append(snackbar)



  // insert the extension UI
  var insertAfter = insertLoc || document
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

  // $('div.builtin', div).append(makeButton('Save', {
  //   onClick: () => {
  //     console.log('clicked on save button')
  //     CalendarManager.saveCalendarSelections()
  //     renderGroupButtons(div)
  //   }
  // }))

  $('div.builtin', div).append(makeButton('User', {
    tooltip: 'Enable a user by name or regexp',
    onClick: () => {
      console.log('clicked on enable user button')
      var user_name = prompt('Enable user by name/regex (current selection will be auto-saved)')
      if(!user_name)
        return
      CalendarManager.enableUser(user_name)
    }
  }))

  $('div.builtin', div).append(makeButton('Save As', {
    tooltip: 'Save current calendars as a<br>named group',
    onClick: () => {
      var group_name = prompt('Save Group name')
      if(!group_name)
        return

      CalendarManager.saveCalendarSelections(group_name)
      renderGroupButtons(div)
      storeGroups()
    }
  }))

  $('div.builtin', div).append(makeButton('Restore', {
    tooltip: 'Restore previous calendars<br>(set by Load & Clear)',
    onClick: () => {
      console.log('clicked on restore button')
      CalendarManager.restoreCalendarSelections()
    }
  }))

  $('div.builtin', div).append(makeButton('Load', {
    tooltip: 'Load a calendar group by name <br>(alternative to clicking on pill)',
    onClick: () => {
      var group_name = prompt('Load group by name/regex (current selection will be auto-saved)')
      if(!group_name)
        return

      CalendarManager.saveCalendarSelections()
      CalendarManager.setGroup(group_name)
    }
  }))

  $('div.builtin', div).append(makeButton('Clear', {
    tooltip: 'Clear all calendars',
    onClick: () => {
      CalendarManager.saveCalendarSelections()
      CalendarManager.disableAll()
      CalendarManager.enableUser('ilya')
    }
  }))

  $(insertAfter).after(div)

  loadGroups(div)

  // append buttons for all built-in
  renderGroupButtons(div)
}

function makeHTML(str){
  var html = $.parseHTML(str);
  $('*', $(html)).each(function () {
    componentHandler.upgradeElement(this);
  });
  // filter out empty space/text nodes
  html = html.filter( el => el.nodeName != '#text')
  return html;
};

function makeButton(name, {clazz, tooltip, onClick}){
  var id = 'button-' + Math.floor(Math.random()*100000)
  var button = makeHTML(`
<button id="${id}" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent">
    <span class="mdl-chip__text">${name}</span>
</button>
<div class="mdl-tooltip" for="${id}">${tooltip}</div>
`)

  if(!tooltip){
    button.splice(1,1) // TODO: this is very fragile
  }

  if(clazz)
    $(button).addClass(clazz)

  $(button).click(onClick)

  return button
}

function makeGroupButton(name, {clazz, members = [], onClick, onDelete}){
  var id = 'button-' + Math.floor(Math.random()*100000)
  var button = makeHTML(`
<button id="${id}" class="mdl-chip mdl-chip--deletable">
    <span class="mdl-chip__text">${name}</span>
    <span class="mdl-chip__action"><i class="material-icons">cancel</i></span>
</button>
<div class="mdl-tooltip" for="${id}">${members.join('<br>')}</div>
`)

  if(clazz)
    $(button).addClass(clazz)

  // attach event handlers
  $(button).click(onClick)
  $('.mdl-chip__action', button).click(onDelete)

  return button
}

function renderGroupButtons(div){
  $('div.saved', div).empty()

  Object.keys(CalendarManager.groups)
    .filter(group_name => !group_name.match(/^(saved_|__)/) )
    .forEach(group_name=>{
      var button = makeGroupButton(group_name, {
        members: CalendarManager.groups[group_name],
        onClick: ()=>{
          console.log('loading group', group_name, CalendarManager.groups[group_name])
          CalendarManager.setGroup(group_name)
        },
        onDelete: ()=>{
          console.log('deleting group', group_name)
          CalendarManager.deleteGroup(group_name)
          renderGroupButtons(div)
          storeGroups()
        }
      })
      $('div.saved', div).append(button)
    })
}

function message(message){
  snackbar.MaterialSnackbar.showSnackbar({
    message: message,
    timeout: 5000,
    // actionHandler: handler,
    // actionText: 'Undo'
  });
}

function storeGroups(){
  chrome.storage.sync.set({
    groups: CalendarManager.groups
  }, () => {
    console.log('groups saved to storage', Object.keys(CalendarManager.groups))
    message('Groups saved to storage: ' + Object.keys(CalendarManager.groups).join(', '))
  })
}

function loadGroups(div){
  chrome.storage.sync.get('groups', (items) => {
    var groups = items.groups
    console.log('groups loaded from storage', groups)
    if(groups)
      CalendarManager.groups = groups
    renderGroupButtons(div)
    message('Groups loaded: ' + Object.keys(CalendarManager.groups).join(', '))
  })
}


insertButton()
