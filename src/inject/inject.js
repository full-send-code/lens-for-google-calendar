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
var ui
function insertUI(insertLoc){
  $('head').append(
    $('<link rel="stylesheet" type="text/css" />')
      .attr('href', "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons")
  )
  try {
    $('head').append(
      $('<link rel="stylesheet" type="text/css" />')
        .attr('href', chrome.runtime.getURL('lib/vue/slim.css'))
    )
  } catch(e) {
    // not running in an extension environment
  }

  snackbar = $.parseHTML(`
    <div id="snackbar" class="mdl-js-snackbar mdl-snackbar">
      <div class="mdl-snackbar__text"></div>
    <button class="mdl-snackbar__action" type="button"></button>
  `)[1]
  componentHandler.upgradeElements(snackbar)
  $('body').append(snackbar)

  var div = $.parseHTML(`
<v-app id="calendar_app">
  <main>
     <v-container fluid grid-list-md text-xs-center>
       <v-layout row>
         <v-flex md6 class="pt-3">
           <span class="btn-toggle">
             <template  v-for="button in buttons">
               <v-tooltip bottom open-delay="1000" transition="false">
                 <v-btn
                     small
                     slot="activator" @click="btn_clicked(button)"
                     :class="['gcs', 'gcs-' + button.class_id]"
                 >
                   {{ button.text.substr(0, button.text.indexOf('&')) }}
                   <span :class="{'kbd-hint': highlight_kb_shortcuts}">
                     {{ button.text.substr(button.text.indexOf('&')+1, 1) }}
                   </span>
                   {{ button.text.substr(button.text.indexOf('&')+2) }}
                 </v-btn>
                 <span>{{ button.tooltip }}</span>
               </v-tooltip>
             </template>

             <v-menu bottom
                     offset-y
                     :close-on-content-click="false"
                     v-model="presets_menu_open"
                     ref="presets_menu"
             >
               <v-btn small slot="activator" @click="presets_open()" class="gcs gcs-presets">
                 <span :class="{'kbd-hint': highlight_kb_shortcuts}">
                   P
                 </span>
                 resets
               </v-btn>
               <v-select
                 class="select"
                 v-bind:items="dropdown"
                 label="Load preset..."
                 editable
                 small
                 return-object
                 hide-details
                 item-value="text"
                 ref="select"
                 @input="select_input"
               >
                 <template slot="item" slot-scope="data">
                   <v-list-tile-content>
                     <v-list-tile-title v-html="data.item.text"></v-list-tile-title>
                   </v-list-tile-content>

                   <v-list-tile-action>
                     <v-btn icon ripple @click.stop="select_delete(data.item)">
                       <v-icon color="grey lighten-1">delete</v-icon>
                     </v-btn>
                   </v-list-tile-action>
                 </template>
               </v-select>
             </v-menu>
           </span>
         </v-flex>
       </v-layout>
     </v-container>
  </main>
</v-app>
`)

  // insert the extension UI
  if(insertLoc){
    $(insertLoc).append(div)
  } else {
    var insertAfter = document
        .querySelectorAll('header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)')[0]
    $(insertAfter).after(div)
  }

  console.log('groups in live', CalendarManager.groups)

  ui = {
    enable_user: ()=>{
      console.log('clicked on enable user button')
      var user_name = prompt('Enable user by name/regex (current selection will be auto-saved)')
      if(!user_name)
        return
      CalendarManager.enableUser(user_name)
    },
    save_as: ()=>{
      var group_name = prompt('Save Group name')
      if(!group_name)
        return

      CalendarManager.saveCalendarSelections(group_name)
      storeGroups()
    },
    restore: ()=>{
      console.log('clicked on restore button')
      CalendarManager.restoreCalendarSelections()
    },
    clear: ()=>{
      CalendarManager.saveCalendarSelections()
      CalendarManager.disableAll()
      CalendarManager.enableUser('ilya')
    },
    presets_open: (vm) => {
      console.log('presets_open', vm)
      setTimeout(()=>{ // timeout to allow the menu to be rendered first
        /* console.log(this.$refs.select)*/
        if(vm.$refs.presets_menu.isActive){
          vm.$refs.select.focusInput()
          vm.$refs.select.showMenu()
        }
      }, 100)
    }
  }

  vm = new Vue({
    el: '#calendar_app',
    data: {
      highlight_kb_shortcuts: false,
      presets_menu_open: false,
      groups: CalendarManager.groups,
      buttons: [
        {text: '&User', tooltip: 'Enable a user by name or regexp', click: ui.enable_user, class_id: 'user'},
        {text: "&Save As", tooltip: 'Save current calendars as a named preset', click: ui.save_as, class_id: 'save_as'},
        {text: "&Restore", tooltip: 'Restore previous calendars (set by Load & Clear)', click: ui.restore, class_id: 'restore'},
        {text: "&Clear", tooltip: 'Clear all calendars', click: ui.clear, class_id: 'clear'},
      ]
    },
    methods: {
      presets_open: function(){
        ui.presets_open(this)
      },
      select_input: function(value) {
        console.log('input', value.text, value)
        // console.log(this)

        this.presets_menu_open = false

        var group_name = value.text
        if(!group_name)
          return

        CalendarManager.saveCalendarSelections()
        CalendarManager.showGroup(group_name)
      },
      select_delete: function(item){
        console.log('DELETE', item.text, item)
        const del = confirm('Are you sure you want to delete this preset?')
        if(del){
          setTimeout(() => {
            const group_name = item.text
            console.log('deleting group', group_name)
            CalendarManager.deleteGroup(group_name)
            storeGroups()
          }, 800)
        }
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
          .map(group_name => {
            return {
              text: group_name,
              subtitle: this.groups[group_name].join(', '),
            }
          })
      },
    }
  })

  // needed to ensure that Vue picks up changes to groups
  CalendarManager.onGroupsChange = function(groups){
    vm.groups = Object.assign({}, groups)
  }

  loadGroups()
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


function message(message){
  snackbar.MaterialSnackbar.showSnackbar({
    message: message,
    timeout: 5000,
    // actionHandler: handler,
    // actionText: 'Undo'
  })
}

function storeGroups(){
  try {
    chrome.storage.sync.set({
      groups: CalendarManager.groups
    }, () => {
      console.log('groups saved to storage', Object.keys(CalendarManager.groups))
      message('Groups saved to storage: ' + Object.keys(CalendarManager.groups).join(', '))
    })
  } catch(e) {
    console.error('Failed to save groups to sync storage: ' + e.message)
  }
}

function loadGroups(){
  try {
    chrome.storage.sync.get('groups', (items) => {
      var groups = items.groups
      if(groups && Object.keys(groups).length > 0){
        CalendarManager.setGroups(groups)
      }
      console.log('groups loaded from storage', CalendarManager.groups)
      // message('Groups loaded: ' + Object.keys(CalendarManager.groups).join(', '))
    })
  } catch(e) {
    console.error('Failed to load groups from sync storage: ' + e.message)
  }
}

function setupKeyboardShortcuts(){
  function showShorcuts(){
    vm.$set(vm, 'highlight_kb_shortcuts', true)
  }

  function hideShortcuts(){
    vm.$set(vm, 'highlight_kb_shortcuts', false)
  }

  Mousetrap.bind(['ctrl+alt', 'alt+ctrl'], function(e, combo) {
    showShorcuts()
  }, 'keydown')

  Mousetrap.bind('ctrl', function(e, combo) {
    hideShortcuts()
  }, 'keyup')


  const parseShortcutText = (text) => {
    return {
      pre:      text.substr(0, text.indexOf('&')),
      shortcut: text.substr(text.indexOf('&')+1, 1),
      post:     text.substr(text.indexOf('&')+2),
    }
  }

  vm.buttons.forEach((button)=>{
    const parts = parseShortcutText(button.text)
    console.log(parts)
    const shortcut = parts.shortcut.toLowerCase()

    Mousetrap.bind(`ctrl+alt+${shortcut}`, function(e, combo) {
      console.log('pressed', combo)
      $(`.btn.gcs-${button.class_id}`).click()
      hideShortcuts()
    })
  })

  Mousetrap.bind('ctrl+alt+p', function(e, combo) {
    // emulate a press on the "Presets" button
    // vm.$refs.presets_menu.activate()
    // vm.$set(vm, 'presets_menu_open', true)
    // ui.presets_open(vm)

    $('.btn.gcs-presets').click()
    hideShortcuts()
  })
}

insertUI()
setupKeyboardShortcuts()
