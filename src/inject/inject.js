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
var vm
function insertButton(insertLoc){
  $('head').append(
    $('<link rel="stylesheet" type="text/css" />')
      .attr('href', "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons")
  )
  $('head').append(
    $('<link rel="stylesheet" type="text/css" />')
      .attr('href', "https://unpkg.com/vuetify/dist/vuetify.min.css")
  )

  // $('body').append($('<script src="https://vuejs.org/js/vue.js"></script>'))

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
<v-app id="calendar_app">
  <main>
    <v-layout row>
      <v-flex xs8 class="py-2">
        <div class="btn-toggle">
          <template  v-for="button in buttons">
            <v-tooltip bottom open-delay="1000" transition="false">
              <v-btn small slot="activator" @click="btn_clicked(button)">{{ button.text }}</v-btn>
              <span>{{ button.tooltip }}</span>
            </v-tooltip>
          </template>
        </div>
      </v-flex>

      <v-flex xs4 class="pa-0 ma-0">
        <v-select 
          v-bind:items="dropdown"
          label="Load preset..."
          editable
          small
          return-object
          item-value="text"
          v-on:input="select_input"
        >
        </v-select>
      </v-flex>
    </v-layout>
  </main>
</v-app>
`)

  // $('div.builtin', div).append(makeButton('Load', {
  //   tooltip: 'Load a calendar group by name <br>(alternative to clicking on pill)',
  //   onClick: () => {
  //     var group_name = prompt('Load group by name/regex (current selection will be auto-saved)')
  //     if(!group_name)
  //       return

  //     CalendarManager.saveCalendarSelections()
  //     CalendarManager.showGroup(group_name)
  //   }
  // }))



  $(insertAfter).after(div)

  console.log('groups in live', CalendarManager.groups)

  vm = new Vue({
    el: '#calendar_app',
    data: {
      groups: CalendarManager.groups,
      buttons: [
        {text: 'User', tooltip: 'Enable a user by name or regexp', click: ()=>{
          console.log('clicked on enable user button')
          var user_name = prompt('Enable user by name/regex (current selection will be auto-saved)')
          if(!user_name)
            return
          CalendarManager.enableUser(user_name)          
        }},
        {text: "Save As", tooltip: 'Save current calendars as a<br>named preset', click: ()=>{
          var group_name = prompt('Save Group name')
          if(!group_name)
            return

          CalendarManager.saveCalendarSelections(group_name)
          // renderGroupButtons(div)
          storeGroups()
        }},
        {text: "Restore", tooltip: 'Restore previous calendars<br>(set by Load & Clear)', click: ()=>{
          console.log('clicked on restore button')
          CalendarManager.restoreCalendarSelections()          
        }},
        {text: "Clear", tooltip: 'Clear all calendars', click: ()=>{
          CalendarManager.saveCalendarSelections()
          CalendarManager.disableAll()
          CalendarManager.enableUser('ilya')
        }},
      ]
    },
    methods: {
      select_input: function(value) {
        console.log('input', value.text, value)
        // console.log(this)

        var group_name = value.text
        if(!group_name)
          return

        CalendarManager.saveCalendarSelections()
        CalendarManager.showGroup(group_name)
      },
      btn_clicked: function(button){
        console.log('clicked on', button.text, button)
        if(button.click){
          button.click()
        }
      },
    },
    computed: {
      dropdown: function() {
        return Object.keys(this.groups)
          .filter(group_name => !group_name.match(/^(saved_|__)/))
          .map(group_name => {return {text: group_name}})
      },
    }
  })

  // .application on v-app doesn't play well with existing google calendar CSS
  $('#calendar_app').removeClass('application')

  loadGroups()

  // // append buttons for all built-in
  // renderGroupButtons()
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

function renderGroupButtons(){
  vm.groups = Object.assign({}, CalendarManager.groups)

  // $('div.saved', div).empty()

  // Object.keys(CalendarManager.groups)
  //   .filter(group_name => !group_name.match(/^(saved_|__)/) )
  //   .forEach(group_name=>{
  //     var button = makeGroupButton(group_name, {
  //       members: CalendarManager.groups[group_name],
  //       onClick: ()=>{
  //         console.log('loading group', group_name, CalendarManager.groups[group_name])
  //         CalendarManager.showGroup(group_name)
  //       },
  //       onDelete: ()=>{
  //         console.log('deleting group', group_name)
  //         CalendarManager.deleteGroup(group_name)
  //         renderGroupButtons(div)
  //         storeGroups()
  //       }
  //     })
  //     $('div.saved', div).append(button)
  //   })
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

function loadGroups(){
  chrome.storage.sync.get('groups', (items) => {
    var groups = items.groups
    if(groups && Object.keys(groups).length > 0){
      CalendarManager.setGroups(groups)
    }
    renderGroupButtons()
    console.log('groups loaded from storage', CalendarManager.groups)
    message('Groups loaded: ' + Object.keys(CalendarManager.groups).join(', '))
  })
}


insertButton()
