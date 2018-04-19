if(chrome && chrome.extension){
  chrome.extension.sendMessage({}, function(response) {
    var readyStateCheckInterval = setInterval(function() {
      if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval);
        // do stuff here...
      }
    }, 10);
  });
}
console.log(window.CalendarManager && CalendarManager.groups)

const parseShortcutText = (text) => {
  return {
    enabled: text.indexOf('&') >= 0,
    pre:     text.substr(0, text.indexOf('&')),
    key:     text.substr(text.indexOf('&')+1, 1),
    post:    text.substr(text.indexOf('&')+2),
    label:   text.replace('&', ''),
    text:    text,
  }
}


var snackbar
var vm
var ui
function insertUI(insertLoc){
  if(vm){
    console.warn('calendar selector menu UI already loaded')
  }

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


  Vue.component('label-kb-shortcut', {
    props: ['text'],
    created: function(){
      // register this shortcut and action
      // console.log('label-kb-shortcut created', this.shortcut)

      if(this.shortcut.enabled){
        this.$root.keyboardActions.push({
          component: this,
          modifier: 'ctrl+alt',
          key: this.shortcut.key.toLowerCase(),
          action: (...args) => {
            this.$emit('kbd', ...args)
          }
        })
      }
    },
    computed: {
      shortcut: function(){
        const shortcut = parseShortcutText(this.text)
        return shortcut
      }
    },
    render: function(h){
      if(!this.shortcut.enabled){
        return h('span', this.text)
      } else {
        return h('span', [
          h('span', this.shortcut.pre),
          h('span', {
            'class': {
              'kbd-hint': this.$root.highlight_kb_shortcuts
            }
          }, this.shortcut.key),
          h('span', this.shortcut.post),
        ])
      }
    }
  })

  Vue.component('gcs-button', {
    inherit: true,
    props: ['text', 'tooltip'],
    data: function () {
      return {
      }
    },
    methods: {
      keyAction: function(){
        // find the button element from there and click it
        this.$el.getElementsByTagName('button')[0].click()
      }
    },
    template: `
 <v-tooltip bottom open-delay="1000" transition="false">
   <v-btn
       small
       slot="activator"
       :class="['gcs']"
       v-on="$listeners"
     >
     <label-kb-shortcut :text="text" @kbd="keyAction"/>
   </v-btn>
   <span>{{ tooltip }}</span>
 </v-tooltip>`
  })

  Vue.component('export-dialog', {
    props: ['groups'],
    data: function(){
      return {
        showDialog: false,
      }
    },
    computed: {
      content: function(){
        return JSON.stringify(this.groups, null)
      },
    },
    template: `
<v-dialog v-model="showDialog" max-width="750px">
  <gcs-button slot="activator" text="&export"></gcs-button>
  <v-card class="grey lighten-5">
    <v-card-title class="headline">
    Presets
    </v-card-title>
    <v-card-text>
      <v-container grid-list-md>
        <v-layout row wrap>
          <v-flex xs10>
            <v-text-field box multi-line readonly v-model="content"></v-text-field>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card-text>
  <v-card-actions>
    <v-btn color="primary" flat @click.stop="showDialog = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>`
  })


  var div = $.parseHTML(`
<v-app id="calendar_app">
  <main>
     <v-container fluid grid-list-md text-xs-center>
       <v-layout row>
         <v-flex md6 class="pt-3">
           <span class="btn-toggle">
             <gcs-button
               v-for="button in buttons"
               :key="button.text"
               v-bind:text="button.text"
               v-bind:tooltip="button.tooltip"
               @click="button.click()"
             ></gcs-button>

             <v-menu bottom
                     offset-y
                     :close-on-content-click="false"
                     v-model="presets_menu_open"
                     ref="presets_menu"
             >
       <v-layout row class="white">
         <v-flex md12 class="text-xs-right">
           <span class="btn-toggle">
             <gcs-button text="import"></gcs-button>
             <export-dialog :groups="groups"></export-dialog>
           </span>
         </v-flex>
       </v-layout>
               <gcs-button
                 slot="activator"
                 @click="presets_open()"
                 tooltip="Manage preset groups"
                 text="&Presets">
               </gcs-button>
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
                 @keyup.esc="presets_menu_open = false"
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
      allGroups: CalendarManager.groups,
      keyboardActions: [],
      buttons: [
        {text: '&User', tooltip: 'Enable a user by name or regexp', click: ui.enable_user},
        {text: "&Save As", tooltip: 'Save current calendars as a named preset', click: ui.save_as},
        {text: "&Restore", tooltip: 'Restore previous calendars (set by Load & Clear)', click: ui.restore},
        {text: "&Clear", tooltip: 'Clear all calendars', click: ui.clear},
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
    },
    computed: {
      dropdown: function() {
        console.log('this.groups', this.groups)
        return Object.keys(this.groups)
          .map(group_name => {
            return {
              text: group_name,
              subtitle: this.groups[group_name].join(', '),
            }
          })
      },
      groups: function() {
        return CalendarManager.exportGroups(false, this.allGroups)
      },
    },
  })

  // needed to ensure that Vue picks up changes to groups, but only store the
  // user groups/presets, not internal ones
  CalendarManager.onGroupsChange = function(groups){
    vm.allGroups = Object.assign({}, groups)
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
      console.log(vm)
      message('Presets saved to storage: ' + Object.keys(CalendarManager.exportGroups()).join(', '))
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
    setTimeout(()=>{
      CalendarManager.setGroups({
        "__last_saved":["saved_1523544210288","saved_1523544212408","dev group","qa team","conference rooms"],"conference rooms":["conf 1", "conf 2"],"dev group":["dev 1", "dev 2", "dev 3"],"qa team":["qa 1"],
      })
    }, 10)
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

  // wrapper for MouseTrap.bind to do our own bidding
  const bindKey = function(...args){
    // find the callback and wrap it
    for(let index in args){
      if(typeof args[index] == 'function'){
        const callback = args[index];

        args[index] = function(...args){
          callback.call(this, ...args)

          hideShortcuts()
        }

        break
      }
    }

    return Mousetrap.bind(...args)
  }

  vm.keyboardActions.forEach((keyAction) => {
    bindKey(`${keyAction.modifier}+${keyAction.key}`, function(e, combo) {
      keyAction.action(e, combo)
    })
  })
}

insertUI()
// do this in the future after all components are registered:
setTimeout(setupKeyboardShortcuts, 1000)

