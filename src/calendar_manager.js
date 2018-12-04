(function(){
  var $ = function(selector, startNode){
    return (startNode || document).querySelector(selector)
  };

  class Overlay {
    // 8 is the width of the scrollbar
    constructor(targetEl, opts = {disabled: false, widthAdjustment: -8}){
      this.targetEl = targetEl
      this.opts = opts
      this.overlay = null
      this.overlayEl = jQuery("<div></div>")
    }

    show() {
      if(this.opts.disabled) {
        return this.overlay
      }

      if(!this.overlay){
        this.overlay = this.overlayEl
          .width(jQuery(this.targetEl).width() + this.opts.widthAdjustment)
          .height(jQuery(this.targetEl).height())
          .prependTo(this.targetEl)
          .addClass('cs-overlay')
          .css('z-index', 100)
      }

      this.overlay.show()
      return this.overlay
    }

    hide() {
      if(this.overlay){
        this.overlay.hide()
      }
    }
  }

  class CalendarDOM {
    /* el: li_item */
    constructor(el, calendar){
      this.el = el
      this.label_el = $('label', el)
      this.checkbox_el = $("div[role='checkbox']", el)

      this.scrollPosition = null

      this.calendar = calendar
    }

    isAttached() {
      return document.body.contains(this.el)
    }

    getScrollContainer(){
      //return this.el.parentElement.parentElement
      return CalendarList.getScrollContainer()
    }

    saveScrollPosition() {
      // ensure that the element is visible so we can reliably scroll back to it
      // NOTE: once cal.el is offscreen, the scroll container (using virtual scrolling), will destroy it
      //       so it cannot be relied upon over time
      this.el.scrollIntoViewIfNeeded() // this is a Webkit-only method!

      // save the scroll position of the element
      this.scrollPosition = this.getScrollContainer().scrollTop
    }

    async scrollTo() {
      const scrollContainer = this.getScrollContainer()

      console.log(this.calendar.name, 'jumping to', this.scrollPosition, 'from', scrollContainer.scrollTop)
      await scrollElementTo(scrollContainer, this.scrollPosition)
      
      // give the virtual scroller some time to render
      await sleep(100)
    }
  }

  class Calendar {
    constructor(li_item){
      Object.assign(this, {
        email: null,
        name: null,
        checked: false,

        dom: null,
      })

      this.setEl(li_item)
    }

    setEl(el) {
      this.dom = new CalendarDOM(el, this)

      Object.assign(this, {
        email: atob(this.dom.label_el.attributes['data-id'].value),
        name: this.dom.checkbox_el.attributes['aria-label'].value,
        checked: this.dom.checkbox_el.attributes['aria-checked'].value === "true"
      })
    }

    getEl() {
      return this.dom.el
    }

    /* NOTE: methods below assume that `this.dom.el` is a valid/existing DOM element */

    toggle(){
      this.dom.label_el.click();
      return this.isChecked()
    }

    isChecked() {
      return this.dom.checkbox_el.attributes['aria-checked'].value === "true"
    }

    enable(){
      var disabled = !this.isChecked();
      disabled && this.toggle();
      return disabled;
    }

    disable(){
      var enabled = this.isChecked();
      enabled && this.toggle();
      return enabled;
    }

    // helper so instances can be constructed
    static create(...args){
      return new Calendar(...args)
    }
  }



  class CalendarList extends Array {
    constructor(...args){
      super(...args)

      this.byName = {}
    }

    push(...calendars /* :[Calendar] */){
      for(let cal of calendars){

        let existingCal = this.get(cal.name)

        // only add elements we haven't seen already
        if(!existingCal){
          super.push(cal)
          this.byName[cal.name] = cal
          existingCal = cal
        }

        // update existing calendar with element from new one to
        // recalculate IF this element is not attached to the DOM tree already
        if(!existingCal.dom.isAttached()) {
          existingCal.setEl(cal.getEl())
          existingCal.dom.saveScrollPosition()
          
          console.log('saving scroll', cal.name, existingCal.dom.scrollPosition)
        }
      }

      return this.length
    }

    updateDOM(...calendars) {
      for(let cal of calendars){
        let existingCal = this.get(cal.name)

        // update existing calendar with element from new one to
        // recalculate IF this element is not attached to the DOM tree already
        if(!existingCal.dom.isAttached()) {
          existingCal.setEl(cal.getEl())
        }
      }
    }

    get(name) {
      return this.byName[name]
    }

    // const cals = CalendarManager.getVisibleOtherCalendars()

    static getScrollContainer(){
      const childHeader = Array.from(jQuery('body h1')).filter(node => node.innerText == "Drawer")[0]
      if(!childHeader) return null

      return childHeader.parentElement // there's also a .parentNode
    }


    static async discoverCalendarScrollPositions(calendars, opts = {restoreOriginalScroll: true}){
      calendars = calendars || new CalendarManager.CalendarList()

      const scrollContainer = CalendarList.getScrollContainer()

      overlay.show()

      await scan(scrollContainer, opts, function detect_calendars(){
        console.log('current scroll position:', scrollContainer.scrollTop)
        const cals = CalendarManager.getVisibleOtherCalendars()

        console.log('currently see:', CalendarManager.getVisibleOtherCalendars().map(c=>c.name))

        calendars.push(...cals)

        // for(let cal of cals){
        //   calendars.push(cal)          
        //   // cal.newToggle = () => {
        //   //   newToggleCalendar(cal, {restoreScroll: false})
        //   // }
        // }
      })

      overlay.hide()

      console.log('all calendars', calendars.map(cal => cal.name))
      return calendars
    }
  }

  const overlay = new Overlay(CalendarList.getScrollContainer(), {
    disabled: true // disable for now since we're doing animation
  })


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

    getOtherCalendarsElements: function(){
      return Array.from($("div[aria-label='Other calendars']").querySelectorAll("li[role='listitem']"))
    },

    getOtherCalendars: function(){
      return CM.getOtherCalendarsElements().map(Calendar.create)
    },

    // friendlier name:
    getVisibleOtherCalendars: function(){
      return CM.getOtherCalendars()
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

      return CM.getVisibleOtherCalendars()
        .filter(c => names.indexOf(c.name) >= 0)
        // .op(CM.addAlwaysEnabledCalendars())
    },

    getCalendarsNotInGroup: function(group_name){
      var names = CM.groups[group_name.toLowerCase()];
      if(!names) {
        console.error('group not found:', group_name);
        return [];
      }

      return CM.getVisibleOtherCalendars()
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
      var cals = CM.getVisibleOtherCalendars()
          .filter(c => c.name.match(re));

      var enabled = cals.filter(c => c.enable()); // enables and filters in one step
      console.log('enabled:', enabled.map(c => c.name));
      return enabled;
    },

    disableUser: function(name){
      // name is a regex string
      var re = RegExp(name, 'i');
      var cals = CM.getVisibleOtherCalendars()
          .filter(c => c.name.match(re));

      var disabled = cals.filter(c => c.disable()); // enables and filters in one step
      console.log('disabled:', disabled.map(c => c.name));
      return disabled;
    },

    disableAll: function(){
      return CM.disableUser('.')
    },

    saveCalendarSelections: function(group_name){
      var active = CM.getVisibleOtherCalendars()
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

  CM.Calendar = Calendar
  CM.CalendarList = CalendarList

  window.CalendarManager = window.CalendarManager || CM;
  console.log('CalendarManager loaded');
})();

const calendars = new CalendarManager.CalendarList()

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

async function scrollElementTo(el, scrollTop, opts = {animate: true}){
  return new Promise((resolve, reject) => {
    jQuery(el).animate({
      scrollTop: scrollTop
    }, {
      duration: opts.animate ? 400 : 0,
      complete: resolve,
    })

    // non-animated version:
    /*
    if(el.scrollTop === scrollTop) return resolve()

    el.scrollTop = scrollTop
    el.addEventListener('scroll', function(){
      setTimeout(function() {
        resolve()
      }, 10)
    }, {once: true, passive: false})
    */
  })
}

async function scrollThroughElement(el, waitTime, scrollIncrementedCb){
  waitTime = waitTime || 100

  while(el.scrollTop < (el.scrollHeight - el.clientHeight)){
    await scrollElementTo(el, el.scrollTop + 50, {animate: false})
    await sleep(waitTime)

    if(typeof scrollIncrementedCb == 'function'){
      await scrollIncrementedCb() // is await appropriate here?
    }
  }
}


async function newToggleCalendar(calendar, opts = {restoreScroll: true}){
  // calendar = globalCalendarsByName[calendar.name]

  function findMatchingAtCurrentScroll(calendar){
    const cals = CalendarManager.getVisibleOtherCalendars()
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
    const savedScrollPosition = cal.getScrollContainer().scrollTop
    await calendar.dom.scrollTo()

    let matching = findMatchingAtCurrentScroll(calendar)
    matching.forEach(cal => cal.toggle())

    console.log('found cal entry:', !!matching.length)

    // if entry is not found, refresh calendar listings and try again
    if(!matching.length){
      console.log("didn't find a matching calendar entry, refreshing list...")
      await CalendarList.discoverCalendarScrollPositions(calendars)
      // calendar = globalCalendarsByName[calendar.name]
      console.log("list refreshed, trying toggle again")

      await calendar.dom.scrollTo()

      let matching = findMatchingAtCurrentScroll(calendar)
      matching.forEach(cal => cal.toggle())

      console.log('found cal entry (giving up if not found):', !!matching.length)
    }

    if(opts.restoreScroll){
      // scroll back to where we came from
      await scrollElementTo(scrollContainer, savedScrollPosition)
    }

    overlay.hide()
  }
}


// await CalendarManager.CalendarList.discoverCalendarScrollPositions(calendars)

// 12/3/18 TODO
// - integrate listAllOthersCalendars() and newToggleCalendar() functions into the normal code flow
// - can't rely on DOM status for functions like isChecked, so those will need to get rewritten to eval immediately and save the result
