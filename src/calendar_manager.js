(function(){
  var $ = function(selector, startNode){
    return (startNode || document).querySelector(selector)
  };

  var CM = {
    __exclude_re: /^(saved_|__)/,

    groups: {
    },

    // used for loading groups from storage without changing the groups reference above
    setGroups: function(new_groups) {
      CM.groups = new_groups
      CM._updated()
    },

    // returns a copy of the groups object
    exportGroups: function(include_internal = false, groups = null){
      const _groups = groups || JSON.parse(JSON.stringify(CM.groups))

      if(!include_internal){
        Object.keys(_groups)
          .filter(group_name => group_name.match(CM.__exclude_re))
          .forEach(excluded_group_name => {
            delete _groups[excluded_group_name]
          })
      }

      return _groups
    },

    // set CM.onGroupsChange function to get updates
    _updated: function(){
      if(typeof CM.onGroupsChange === 'function'){
        CM.onGroupsChange(CM.groups)
      }
    },

    createCalendarController: function(li_item){
      var label_el = $('label', li_item);
      var checkbox_el = $("div[role='checkbox']", li_item);

      var controller = {
        //    email_base64: label_el.attributes['data-id'].value,
        email: atob(label_el.attributes['data-id'].value),
        name: checkbox_el.attributes['aria-label'].value,
        checked: checkbox_el.attributes['aria-checked'].value === "true" ? true : false,

        toggle: function(){ label_el.click(); return controller.isChecked() },
        isChecked: function() { return checkbox_el.attributes['aria-checked'].value === "true" ? true : false },
        enable: function(){
          var disabled = !controller.isChecked();
          disabled && controller.toggle();
          return disabled;
        },
        disable: function(){
          var enabled = controller.isChecked();
          enabled && controller.toggle();
          return enabled;
        },
        el: li_item,
        label_el,
      };

      return controller
    },

    getOtherCalendarsElements: function(){
      return Array.from($("div[aria-label='Other calendars']").querySelectorAll("li[role='listitem']"))
    },

    getOtherCalendars: function(){
      return CM.getOtherCalendarsElements().map(CM.createCalendarController)
    },

    // /* usage:
    //  * calendarsArray.op(addAlwaysEnabledCalendars())
    //  */
    // addAlwaysEnabledCalendars: function(always_on = CM.groups.__always_on){
    //   return function(calendars){
    //     console.log(calendars)
    //     for(let cal of always_on){
    //       if(calendars.indexOf(cal) < 0){
    //         calendars.push(cal)
    //       }
    //     }
    //     return calendars
    //   }
    // },

    getCalendarsForGroup: function(group_name){
      var names = CM.groups[group_name.toLowerCase()];
      if(!names) {
        console.error('group not found:', group_name);
        return [];
      }

      return CM.getOtherCalendars()
        .filter(c => names.indexOf(c.name) >= 0)
        // .op(CM.addAlwaysEnabledCalendars())
    },

    getCalendarsNotInGroup: function(group_name){
      var names = CM.groups[group_name.toLowerCase()];
      if(!names) {
        console.error('group not found:', group_name);
        return [];
      }

      return CM.getOtherCalendars()
        .filter(c => names.indexOf(c.name) < 0)
    },

    enableGroup: function(group_name){
      return CM.getCalendarsForGroup(group_name)
        .filter(c => c.enable())
    },

    disableNonGroup: function(group_name){
      return CM.getCalendarsNotInGroup(group_name)
        .filter(c => c.disable())
    },

    showGroup: function(group_name){
      // CM.disableAll();
      // setTimeout(() => {
        var enabled = CM.enableGroup(group_name);
        console.log('enabled:', group_name, '=>', enabled.map(c => c.name));
      // }, 1000);

      CM.disableNonGroup(group_name);
    },

    disableGroup: function(group_name){
      return CM.getCalendarsForGroup(group_name)
        .filter(c => c.disable())
    },

    deleteGroup: function(group_name){
      var groups = CM.groups = CM.groups || {};
      groups.__last_saved = groups.__last_saved || [];

      console.log('deleting calendar group:', group_name, '=>', groups[group_name]);

      groups.__last_saved = groups.__last_saved.filter(name => name !== group_name)
      delete groups[group_name];

      CM._updated()

      return groups[group_name];
    },

    enableUser: function(name){
      // name is a regex string
      var re = RegExp(name, 'i');
      var cals = CM.getOtherCalendars()
          .filter(c => c.name.match(re));

      var enabled = cals.filter(c => c.enable()); // enables and filters in one step
      console.log('enabled:', enabled.map(c => c.name));
      return enabled;
    },

    disableUser: function(name){
      // name is a regex string
      var re = RegExp(name, 'i');
      var cals = CM.getOtherCalendars()
          .filter(c => c.name.match(re));

      var disabled = cals.filter(c => c.disable()); // enables and filters in one step
      console.log('disabled:', disabled.map(c => c.name));
      return disabled;
    },

    disableAll: function(){
      return CM.disableUser('.')
    },

    saveCalendarSelections: function(group_name){
      var active = CM.getOtherCalendars()
          .filter(c => c.isChecked());

      var group_name = (group_name || "saved_" + Date.now()).toLowerCase();
      var groups = CM.groups = CM.groups || {};

      groups[group_name] = active.map(c => c.name);

      groups.__last_saved = groups.__last_saved || [];
      groups.__last_saved.push(group_name);

      console.log('saved calendars:', group_name, '=>', groups[group_name]);
      CM._updated()
      return groups[group_name];
    },

    restoreCalendarSelections: function(){
      if(!CM.groups.__last_saved){
        console.error('no saved groups');
        return;
      }

      var group_name = CM.groups.__last_saved.pop();

      if(group_name){
        CM.showGroup(group_name)
      } else {
        console.error('nothing to restore');
      }
    }
  };

  window.CalendarManager = window.CalendarManager || CM;
  console.log('CalendarManager loaded');
})();

async function scan(el, opts, scrollIncrementedCb){
  let savedPosition = el.scrollTop

  el.scrollTop = 0

  await scrollThroughElement(el, 100, scrollIncrementedCb)
  console.log('done scanning')

  // if true, revert to original scroll position after the scan
  if(opts.restoreOriginalScroll){
    el.scrollTop = savedPosition
  }
}

function sleep(ms){
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

async function scrollElementTo(el, scrollTop){
  return new Promise((resolve, reject) => {
    if(el.scrollTop === scrollTop) return resolve()

    el.scrollTop = scrollTop
    el.addEventListener('scroll', function(){
      setTimeout(function() {
        resolve()
      }, 10)
    }, {once: true, passive: false})
  })
}

async function scrollThroughElement(el, waitTime, scrollIncrementedCb){
  waitTime = waitTime || 100

  while(el.scrollTop < (el.scrollHeight - el.clientHeight)){
    await scrollElementTo(el, el.scrollTop + 50)
    await sleep(waitTime)

    if(typeof scrollIncrementedCb == 'function'){
      await scrollIncrementedCb() // is await appropriate here?
    }
  }
}


function getScrollContainer(){
  const childHeader = Array.from($('body h1')).filter(node => node.innerText == "Drawer")[0]
  if(!childHeader) return null

  return childHeader.parentElement // there's also a .parentNode
}


async function newToggleCalendar(calendar){
  calendar = globalCalendarsByName[calendar.name]

  function findMatchingAtCurrentScroll(calendar){
    const cals = CalendarManager.getOtherCalendars()
    console.log(`looking for ${calendar.name} in ${cals.map(cal => cal.name)}`)

    const matching = cals.filter(cal => cal.name == calendar.name)
    return matching
  }

  // determine if we need to scroll at all, and if found, ensures we
  // have a valid dom element to operate on
  let matching = findMatchingAtCurrentScroll(calendar)
  let found = !!matching.length

  if(found){
    // no need to scroll, toggle directly
    matching.forEach(cal => cal.toggle())
  } else {
    overlay.show()

    // target calendar not in view, we need to scroll
    const savedScrollPosition = scrollContainer.scrollTop
    await calendar.scrollTo()

    let matching = findMatchingAtCurrentScroll(calendar)
    matching.forEach(cal => cal.toggle())

    console.log('found cal entry:', !!matching.length)

    // if entry is not found, refresh calendar listings and try again
    if(!matching.length){
      console.log("didn't find a matching calendar entry, refreshing list...")
      const calendars = await listAllOthersCalendars()
      calendar = globalCalendarsByName[calendar.name]
      console.log("list refreshed, trying toggle again")

      await calendar.scrollTo()

      let matching = findMatchingAtCurrentScroll(calendar)
      matching.forEach(cal => cal.toggle())

      console.log('found cal entry (giving up if not found):', !!matching.length)
    }

    // scroll back to where we came from
    await scrollElementTo(scrollContainer, savedScrollPosition)

    overlay.hide()
  }
}

scrollContainer = getScrollContainer()

globalCalendarList = []
globalCalendarsByName = {}

const overlay = (function(container) {
  this.overlay = null

  this.overlayEl = jQuery("<div></div>")

  return {
    show: () => {
      if(!this.overlay){
        this.overlay = this.overlayEl
          .width(jQuery(container).width() - 8) // 8 is the width of the scrollbar
          .height(jQuery(container).height())
          .prependTo(container)
          .addClass('cs-overlay')
          .css('z-index', 100)
      }
      this.overlay.show()
      return this.overlay
    },

    hide: () => {
      if(this.overlay){
        // this.overlay.remove()
        // this.overlay = null
        this.overlay.hide()
      }
    }
  }
})(scrollContainer)


async function listAllOthersCalendars(opts = {restoreOriginalScroll: true}, cb){
  const calendars = []
  const seenCalendars = {}

  const scrollContainer = getScrollContainer()

  overlay.show()

  await scan(scrollContainer, opts, function scroll(){
    console.log('current scroll position:', scrollContainer.scrollTop)
    const cals = CalendarManager.getOtherCalendars()

    console.log('currently see:', CalendarManager.getOtherCalendars().map(c=>c.name))

    for(let cal of cals){
      if(!seenCalendars[cal.name]){
        // ensure that the element is visible so we can reliably scroll back to it
        // NOTE: once cal.el is offscreen, the scroll container (using virtual scrolling), will destroy it
        //       so it cannot be relied upon over time
        cal.el.scrollIntoViewIfNeeded() // this is a Webkit-only method!

        // save the scroll position of the element
        cal.scrollPosition = scrollContainer.scrollTop

        console.log('saving scroll', cal.name, cal.scrollPosition)

        seenCalendars[cal.name] = true
        calendars.push(cal)

        cal.newToggle = () => {
          newToggleCalendar(cal)
        }
        cal.scrollTo = async function() {
          console.log(this.name, 'jumping to', this.scrollPosition, 'from', scrollContainer.scrollTop)
          await scrollElementTo(scrollContainer, this.scrollPosition)

          // give the virtual scroller some time to render
          await sleep(100)
        }
      }
    }
  })

  overlay.hide()

  console.log('all calendars', calendars.map(cal => cal.name))

  globalCalendarList = calendars
  for(let cal of calendars){
    globalCalendarsByName[cal.name] = cal
  }

  typeof cb == 'function' && cb(null, calendars)

  return calendars
}

// 12/3/18 TODO
// - integrate listAllOthersCalendars() and newToggleCalendar() functions into the normal code flow
// - can't rely on DOM status for functions like isChecked, so those will need to get rewritten to eval immediately and save the result
