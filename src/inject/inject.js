if(chrome && chrome.runtime){
  chrome.runtime.sendMessage({}, function(response) {
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
        .attr('href', chrome.runtime.getURL('lib/vue/vuetify_scoped.css'))
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
        const keyboardAction = {
          component: this,
          modifier: 'ctrl+alt',
          key: this.shortcut.key.toLowerCase(),
          action: (...args) => {
            this.$emit('kbd', ...args)
          }
        }
        this.$root.keyboardActions.push(keyboardAction)

        this.$emit('shortcut-keys', `${keyboardAction.modifier}-${keyboardAction.key}`)
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
        keyboardShortcut: ""
      }
    },
    methods: {
      keyAction: function(){
        // find the button element from there and click it
        this.$el.getElementsByTagName('button')[0].click()
      },
    },
    render: function (h) {
      var self = this;
      return h('v-tooltip', {
        props: {
          bottom: true,
          'open-delay': 500,
          transition: false
        }
      }, [
        h('v-btn', {
          props: {
            small: true
          },
          class: ['gcs'],
          slot: 'activator',
          on: this.$listeners
        }, [
          h('label-kb-shortcut', {
            props: {
              text: this.text
            },
            on: {
              kbd: this.keyAction,
              'shortcut-keys': function(event) {
                self.keyboardShortcut = event;
              }
            }
          })
        ]),
        h('span', this.tooltip + (this.keyboardShortcut ? ' [' + this.keyboardShortcut + ']' : ''))
      ]);
    }
  })

  Vue.component('export-dialog', {
    props: ['groups'],
    data: function(){
      return {
        showDialog: false,
      }
    },
    watch: {
      showDialog: function(v){
        if(v){
          this.$nextTick(function(){
            this.$refs.txt.focus()
            this.$refs.txt.$refs.input.select()
          })
        }
      }
    },
    methods: {
      close: function(){
        this.showDialog = false
      },
    },
    computed: {
      content: function(){
        return JSON.stringify(this.groups, null)
      },
    },
    render: function (h) {
      var self = this;
      return h('v-dialog', {
        props: {
          value: this.showDialog,
          'max-width': '750px',
          transition: 'slide-y-transition',
          origin: 'top center 0'
        },
        on: {
          input: function(val) {
            self.showDialog = val;
          },
          keydown: function(e) {
            if (e.key === 'Escape') {
              self.close();
            }
          }
        }
      }, [
        h('gcs-button', {
          props: {
            text: 'e&xport'
          },
          slot: 'activator'
        }),
        h('v-card', {
          class: 'grey lighten-5'
        }, [
          h('v-card-title', {
            class: 'headline'
          }, [
            'Export Presets',
            h('v-spacer'),
            h('v-btn', {
              props: {
                icon: true
              },
              on: {
                click: this.close
              }
            }, [
              h('v-icon', 'close')
            ])
          ]),
          h('v-card-text', [
            h('v-text-field', {
              props: {
                box: true,
                'multi-line': true,
                readonly: true,
                value: this.content
              },
              ref: 'txt'
            })
          ]),
          h('v-card-actions', [
            h('v-spacer'),
            h('v-btn', {
              props: {
                color: 'primary',
                flat: true
              },
              on: {
                click: this.close
              }
            }, 'Close')
          ])
        ])
      ]);
    }
  })


  Vue.component('import-dialog', {
    props: [''],
    data: function(){
      return {
        showDialog: false,
        valid: true,
        content: "",
        contentRules: [
          v => {
            try {
              JSON.parse(v)
              return true
            } catch(e){
             return 'Must be valid JSON'
            }
          }
        ],
      }
    },
    watch: {
      showDialog: function(v){
        if(v){
          this.$nextTick(this.$refs.txt.focus)
        } else {
          this.content = ""
        }
      }
    },
    methods: {
      close: function(){
        this.showDialog = false
      },
      save: function(){
        const content = JSON.parse(this.content)
        this.$emit('import', content)
        this.close()
      }
    },
    render: function (h) {
      var self = this;
      return h('v-dialog', {
        props: {
          value: this.showDialog,
          'max-width': '750px',
          transition: 'slide-y-transition',
          origin: 'top center 0'
        },
        on: {
          input: function(val) {
            self.showDialog = val;
          },
          keydown: function(e) {
            if (e.key === 'Escape') {
              self.close();
            }
          }
        }
      }, [
        h('gcs-button', {
          props: {
            text: '&import'
          },
          slot: 'activator'
        }),
        h('v-card', {
          class: 'grey lighten-5'
        }, [
          h('v-form', {
            props: {
              value: this.valid
            },
            on: {
              input: function(val) {
                self.valid = val;
              }
            },
            ref: 'form'
          }, [
            h('v-card-title', {
              class: 'headline'
            }, [
              'Import Presets',
              h('v-spacer'),
              h('v-btn', {
                props: {
                  icon: true
                },
                on: {
                  click: this.close
                }
              }, [
                h('v-icon', 'close')
              ])
            ]),
            h('v-card-text', [
              h('v-text-field', {
                props: {
                  box: true,
                  'multi-line': true,
                  value: this.content,
                  rules: this.contentRules
                },
                on: {
                  input: function(val) {
                    self.content = val;
                  }
                },
                ref: 'txt'
              })
            ]),
            h('v-card-actions', [
              h('v-spacer'),
              h('v-btn', {
                props: {
                  color: 'primary',
                  flat: true,
                  disabled: !this.valid
                },
                on: {
                  click: this.save
                }
              }, 'Save')
            ])
          ])
        ])
      ]);
    }
  })


  console.log('groups in live', CalendarManager.groups)

  ui = {
    enable_calendar: async ()=>{
      console.log('clicked on enable calendar button')
      var calendar_name = prompt('Enable calendar by name (case insensitive regex)')
      if(!calendar_name)
        return
      await CalendarManager.enableCalendar(calendar_name)
    },
    toggle_calendar: async ()=>{
      var calendar_name = prompt('Toggle calendar by name (case insensitive regex)')
      if(!calendar_name)
        return
      await CalendarManager.toggleCalendar(calendar_name)
    },
    save_as: async ()=>{
      var group_name = prompt('Save Group name')
      if(!group_name)
        return

      await CalendarManager.saveCalendarSelections(group_name)
      storeGroups()
    },
    restore: async ()=>{
      console.log('clicked on restore button')
      await CalendarManager.restoreCalendarSelections()
    },
    clear: async ()=>{
      CalendarManager.performOperation(async () => {
        await CalendarManager.saveCalendarSelections()
        await CalendarManager.disableAll()
      }, 'clear')
    },
    presets_open: async (vm) => {
      console.log('presets_open', vm)
      setTimeout(()=>{ // timeout to allow the menu to be rendered first
        /* console.log(this.$refs.select)*/
        if(vm.$refs.presets_menu.isActive){
          vm.$refs.select.focusInput()
          vm.$refs.select.showMenu()
        }
      }, 100)
    },
  }


  // insert the extension UI. Do it after a timeout to give dependencies a chance to load
  setTimeout(() => {
    // Create a mount element for Vue
    var mountElement = document.createElement('div')

    if(insertLoc){
      $(insertLoc).append(mountElement)
    } else {
      var insertAfter = document
          .querySelectorAll('header > div:nth-child(2) > div:nth-child(2) > div:nth-child(1)')[0]
      $(insertAfter).after(mountElement)
    }

    vm = new Vue({
      data: {
        highlight_kb_shortcuts: false,
        presets_menu_open: false,
        allGroups: CalendarManager.groups,
        keyboardActions: [
          // non gcs-button driven actions added here directly
          { // toggle
            modifier: 'ctrl+alt',
            key: 't',
            action: ui.toggle_calendar,
          }
        ],
        buttons: [
          {text: '&Enable', tooltip: 'Enable a calendar by name or regexp', click: ui.enable_calendar},
          {text: "&Save As", tooltip: 'Save current calendars as a named preset', click: ui.save_as},
          {text: "&Restore", tooltip: 'Restore previous calendars (set by Load & Clear)', click: ui.restore},
          {text: "&Clear", tooltip: 'Clear all calendars', click: ui.clear},
        ]
      },
      methods: {
        presets_open: function(){
          ui.presets_open(this)
        },
        select_input: async function(value) {
          console.log('input', value.text, value)
          // console.log(this)

          this.presets_menu_open = false

          var group_name = value.text
          if(!group_name)
            return

          CalendarManager.performOperation(async () => {
            await CalendarManager.saveCalendarSelections()
            await CalendarManager.showGroup(group_name)
          }, 'select_input')
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
        import_presets: function(groups){
          CalendarManager.setGroups(groups)
          storeGroups()
        },
        custom_preset_filter: function(item, queryText, itemText){
          var hasValue = val => val != null ? val : ''

          var text = hasValue(itemText);
          var query = hasValue(queryText);

          return text.toString().toLowerCase().startsWith(query.toString().toLowerCase());
        }
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
      render: function(h) {
        var self = this;
        return h('v-app', {
          attrs: {
            id: 'calendar_selector_ui'
          }
        }, [
          h('main', [
            h('v-container', {
              props: {
                fluid: true,
                'grid-list-md': true,
                'text-xs-center': true
              }
            }, [
              h('v-layout', {
                props: {
                  row: true
                }
              }, [
                h('v-flex', {
                  props: {
                    md6: true
                  },
                  class: 'pt-3'
                }, [
                  h('span', {
                    class: 'btn-toggle'
                  }, [
                    // Render buttons
                    ...this.buttons.map(button => {
                      return h('gcs-button', {
                        key: button.text,
                        props: {
                          text: button.text,
                          tooltip: button.tooltip
                        },
                        on: {
                          click: button.click
                        }
                      })
                    }),
                    // Render presets menu
                    h('v-menu', {
                      props: {
                        bottom: true,
                        'offset-y': true,
                        'close-on-content-click': false,
                        value: this.presets_menu_open
                      },
                      on: {
                        input: function(val) {
                          self.presets_menu_open = val;
                        }
                      },
                      ref: 'presets_menu'
                    }, [
                      h('v-layout', {
                        class: 'white'
                      }, [
                        h('v-flex', {
                          props: {
                            md12: true
                          },
                          class: 'text-xs-right'
                        }, [
                          h('span', {
                            class: 'btn-toggle'
                          }, [
                            h('import-dialog', {
                              on: {
                                import: this.import_presets
                              }
                            }),
                            h('export-dialog', {
                              props: {
                                groups: this.groups
                              }
                            })
                          ])
                        ])
                      ]),
                      h('gcs-button', {
                        slot: 'activator',
                        props: {
                          tooltip: 'Manage preset groups',
                          text: '&Presets'
                        },
                        on: {
                          click: this.presets_open
                        }
                      }),
                      h('v-select', {
                        class: 'select',
                        props: {
                          items: this.dropdown,
                          label: 'Load preset...',
                          editable: true,
                          small: true,
                          'return-object': true,
                          'hide-details': true,
                          'item-value': 'text',
                          filter: this.custom_preset_filter
                        },
                        on: {
                          'keyup.esc': function() {
                            self.presets_menu_open = false;
                          },
                          input: this.select_input
                        },
                        ref: 'select',
                        scopedSlots: {
                          item: function(props) {
                            return h('template', [
                              h('v-list-tile-content', [
                                h('v-list-tile-title', {
                                  domProps: {
                                    innerHTML: props.item.text
                                  }
                                })
                              ]),
                              h('v-list-tile-action', [
                                h('v-btn', {
                                  props: {
                                    icon: true,
                                    ripple: true
                                  },
                                  on: {
                                    click: function(e) {
                                      e.stopPropagation();
                                      self.select_delete(props.item);
                                    }
                                  }
                                }, [
                                  h('v-icon', {
                                    props: {
                                      color: 'grey lighten-1'
                                    }
                                  }, 'delete')
                                ])
                              ])
                            ]);
                          }
                        }
                      })
                    ])
                  ])
                ])
              ])
            ])
          ])
        ]);
      }
    })

    // Mount Vue to the created element
    vm.$mount(mountElement)

    // needed to ensure that Vue picks up changes to groups, but only store the
    // calendar groups/presets, not internal ones
    CalendarManager.onGroupsChange = function(groups){
      vm.allGroups = Object.assign({}, groups)
    }

    loadGroups()
  }, 1000)
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


function message(msg){
  snackbar.MaterialSnackbar.showSnackbar({
    message: msg,
    timeout: 5000,
    // actionHandler: handler,
    // actionText: 'Undo'
  })
}

function storeGroups(){
  try {
    let groups = CalendarManager.exportGroups(true)

    // truncate the number of autosaved states that should get saved
    // remove list of saved_{TS} entries, and remove their names from __last_saved array
    const to_remove = Object.keys(groups).filter(preset_name => {
      return preset_name && preset_name.indexOf('saved_') == 0
    })
          .sort()
          .reverse()
          .splice(3) // keep last 3

    // console.log('removing: ', to_remove)
    to_remove.forEach( preset_name => {
      delete groups[preset_name]
      groups.__last_saved.splice(groups.__last_saved.indexOf(preset_name), 1)
    })

    // migrate storage format, if necessary
    if(typeof groups.__v == 'undefined'){
      groups = migrateToV1(groups)
    }

    // for future proofing, include a version of the saved format
    groups.__v = 1

    chrome.storage.sync.set({
      groups: groups
    }, () => {
      if(chrome.runtime.lastError){
        // error handling
        const msg = `Failed to save groups to sync storage: ${chrome.runtime.lastError.message}`
        console.error(msg)
        message(msg)
      } else {
        console.log('groups saved to storage', Object.keys(groups))
        console.log(vm)
        message('Presets saved to storage: ' + Object.keys(CalendarManager.exportGroups(false, groups)).join(', '))
      }
    })
  } catch(e) {
    console.error('Failed to save groups to sync storage: ' + e.message, e)
    message('Failed to save groups to sync storage: ' + e.message)
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

function migrateToV1(groups){
  const name2id = (calName) => {
    const cal = CalendarManager.calendars.byName[calName]
    if(cal){
      return cal.id
    } else {
      // if a calendar for given name is not found, keep original name
      // (assume it's either for a different account, or already an id)
      return calName
    }
  }

  const v1Groups = {}
  for(let groupName of Object.keys(CalendarManager.exportGroups(false, groups))){
    v1Groups[groupName] = groups[groupName].map( name2id )
  }

  return v1Groups
}

function setupKeyboardShortcuts(){
  function showShorcuts(){
    vm.$set(vm, 'highlight_kb_shortcuts', true)
  }

  function hideShortcuts(){
    vm.$set(vm, 'highlight_kb_shortcuts', false)
  }

  Mousetrap.bindGlobal(['ctrl+alt', 'alt+ctrl'], function(e, combo) {
    showShorcuts()
  }, 'keydown')

  Mousetrap.bindGlobal('ctrl', function(e, combo) {
    hideShortcuts()
  }, 'keyup')

  // wrapper for MouseTrap.bind to do our own bidding (ensure that shortcut display is off)
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

    return Mousetrap.bindGlobal(...args)
  }

  vm.keyboardActions.forEach((keyAction) => {
    // console.log('registering keyboard action: ', `${keyAction.modifier}+${keyAction.key}`, keyAction.action)
    bindKey(`${keyAction.modifier}+${keyAction.key}`, function(e, combo) {
      // console.log('keyboard action: ', combo, e)
      keyAction.action(e, combo)
    })
  })
}

// autoload UI if running in an extension
if(window.chrome && chrome.runtime){
  insertUI()
}
// do this in the future after all components are registered:
setTimeout(setupKeyboardShortcuts, 2000)

