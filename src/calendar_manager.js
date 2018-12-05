(function(){
  var $ = function(selector, startNode){
    return (startNode || document).querySelector(selector)
  };

  class Overlay {
    // 8 is the width of the scrollbar
    constructor(targetEl, opts = {}){
      this.targetEl = targetEl
      this.opts = Object.assign({disabled: false, widthAdjustment: -8}, opts)
      this.overlay = null
      this.overlayEl = jQuery("<div></div>")

      this.showCount = 0
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
      this.showCount++

      return this.overlay
    }

    hide() {
      if(this.opts.disabled) {
        return
      }

      this.showCount--

      if(this.overlay && this.showCount <= 0 ){
        this.overlay.hide()
        this.showCount = 0
      }
    }
  }

  class CalendarDOM {
    /* el: li_item */
    constructor(el, calendar){
      this.el = el
      this.label_el = $('label', el)
      this.checkbox_el = $("div[role='checkbox']", el)

      this.calendar = calendar
    }

    isAttached() {
      return document.body.contains(this.el)
    }

    getScrollContainer(){
      //return this.el.parentElement.parentElement
      return CalendarList.getScrollContainer()
    }

    async calculateScrollPosition() {
      // ensure that the element is visible so we can reliably scroll
      // back to it
      // NOTE: once cal.el is offscreen, the scroll
      // container (using virtual scrolling), will destroy it so it
      // cannot be relied upon over time
      this.el.scrollIntoView({behavior: 'auto', block: 'center'})

      // return the scroll position of the element
      return this.getScrollContainer().scrollTop
    }

    async scrollTo() {
      const scrollContainer = this.getScrollContainer()
      const scrollPosition = this.calendar.scrollPosition

      console.log(this.calendar.name, 'jumping from', scrollContainer.scrollTop, 'to', scrollPosition)
      await scrollElementTo(scrollContainer, scrollPosition)

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
        scrollPosition: null,
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

    get attached() {
      return this.dom.isAttached()
    }

    getEl() {
      return this.dom.el
    }

    async saveScrollPosition() {
      this.scrollPosition = await this.dom.calculateScrollPosition()
      console.log('saved scroll position:', this.name, this.scrollPosition)
    }

    isChecked() {
      return this.checked
    }

    /* NOTE: methods below assume that `this.dom.el` is a valid/existing DOM element */

    toggle(){
      this.dom.label_el.click();
      return this.isChecked()
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

      this.initialized = false
    }

    async initialize(){
      if(!this.initialized){
        await this.discoverCalendarScrollPositions()

        // add listener to re-sync dom when the user clicks on the calendar list manually
        CalendarList.getScrollContainer().addEventListener('click', (event) => {
          if(event.isTrusted){
            // timeout to give the original click event time to change state
            setTimeout( () => this.refreshVisibleCalendarDOMs(), 500 )
          }
        }, {passive: true})

        this.initialized = true
      }
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

        // automatically update existing calendar with element from new one to
        // recalculate IF this element is not attached to the DOM tree already
        if(cal.dom.isAttached()) {
          existingCal.setEl(cal.getEl())
        }

        // TODO: it's hacky to try to keep maintaining state like that
        // a better solution is to keep state (scrollPosition) outside of the Calendar instances themselves
        // Rewrite CalendarList is just having id2calendar and id2scrollPosition maps
        if(cal.scrollPosition !== null) {
          existingCal.scrollPosition = cal.scrollPosition
        }
      }

      return this.length
    }

    get(name) {
      return this.byName[name]
    }

    refreshVisibleCalendarDOMs(...cals) {
      let visible = CalendarManager.getVisibleOtherCalendars()
      if(cals.length){
        let nameFilter = cals.map( c => c.name )
        visible = visible.filter( c => nameFilter.indexOf(c.name) >= 0 )
      }
      this.push(...visible) // will ensure that valid doms overwrite invalid doms
      return visible
    }

    async ensureValidDOM(calendar, opts = {restoreScroll: true}) {
      // at this point we'll try to do some scrolling

      let scrollContainer, savedScrollPosition
      if(opts.restoreScroll){
        scrollContainer = CalendarList.getScrollContainer()
        savedScrollPosition = scrollContainer.scrollTop
      }
      overlay.show()

      const result = await this._ensureValidDOM(calendar)

      if(opts.restoreScroll){
        // scroll back to where we came from
        await scrollElementTo(scrollContainer, savedScrollPosition)
      }
      overlay.hide()

      return result
    }

    async _ensureValidDOM(calendar, opts = {restoreScroll: true}) {
      // already have valid dom, do nothing
      if(calendar.dom.isAttached()){
        return true
      }

      // we might be scrolled to the element already, try to refresh
      this.refreshVisibleCalendarDOMs()
      if(calendar.dom.isAttached()){
        return true
      }

      // try scrolling to calendar, and refresh
      await calendar.dom.scrollTo()
      this.refreshVisibleCalendarDOMs()
      if(calendar.dom.isAttached()){
        return true
      }

      // our scroll position could be wrong, so rediscover all scroll positions,
      // rescroll, and refresh
      await this.discoverCalendarScrollPositions()
      await sleep(100)
      console.log('new cal scroll position:', calendar.scrollPosition)
      await calendar.dom.scrollTo()
      this.refreshVisibleCalendarDOMs()
      if(calendar.dom.isAttached()){
        return true
      }

      // if we get here, we can't find the calendar entry in the scroll list
      return false
    }

    async toggleAll(cals, opts = {restoreScroll: true}) {
      await this.initialize()

      let scrollContainer, savedScrollPosition
      if(opts.restoreScroll){
        scrollContainer = CalendarList.getScrollContainer()
        savedScrollPosition = scrollContainer.scrollTop
      }
      overlay.show()

      const results = {}

      for(let cal of cals){
        let enabled = await this.toggle(cal, {restoreScroll: false})
        results[cal.name] = enabled
      }

      console.log('post-toggle states:', results)

      if(opts.restoreScroll){
        // scroll back to where we came from
        await scrollElementTo(scrollContainer, savedScrollPosition)
      }
      overlay.hide()

      return results
    }

    async toggle(cal, opts = {restoreScroll: true}) {
      await this.initialize()

      const valid = await this.ensureValidDOM(cal, opts)

      if(!valid){
        console.error('Could not find valid DOM node for calendar entry', cal.name, cal)
        return
      }

      let result = cal.toggle()

      await sleep(200) // wait for the checkbox to change state
      console.log('refreshing DOMSs')
      this.refreshVisibleCalendarDOMs(cal) // refresh internal checked state from the DOM

      return cal.isChecked()
    }

    async enable(filterFn) {
      await this.initialize()

      if(typeof filterFn != 'function'){
        return
      }

      const cals = this
            .filter(filterFn)
            .filter(c => !c.isChecked())

      await this.toggleAll(cals)

      // check state of all calendars
      const failed = this
            .filter(filterFn)
            .filter(c => !c.isChecked())

      if(failed.length){
        console.error('failed to enable calendars:', failed)

        console.log('retrying...')
        this.enable(filterFn)
      }
    }

    async disable(filterFn) {
      await this.initialize()

      if(typeof filterFn != 'function'){
        return
      }

      const cals = this
            .filter(filterFn)
            .filter(c => c.isChecked())

      await this.toggleAll(cals)

      // check state of all calendars
      const failed = this
            .filter(filterFn)
            .filter(c => c.isChecked())

      if(failed.length){
        console.error('failed to disable calendars:', failed)
      }
    }

    async toggleByName(calNames, opts){
      if(!Array.isArray(calNames)){
        calNames = [calNames]
      }

      const cals = this.filter( (cal) => {
        // TODO: can be optimized by removing matched name from calNames
        return calNames.indexOf(cal.name) >= 0
      })

      await this.toggleAll(cals, opts)
    }

    async discoverCalendarScrollPositions() {
      await CalendarList.discoverCalendarScrollPositions(this)
    }


    static getScrollContainer(){
      const childHeader = Array.from(jQuery('body h1')).filter(node => node.innerText == "Drawer")[0]
      if(!childHeader) return null

      return childHeader.parentElement // there's also a .parentNode
    }


    static async discoverCalendarScrollPositions(calendars, opts = {}){
      opts = Object.assign({restoreOriginalScroll: true, scrollIncrement: 50}, opts)

      calendars = calendars || new CalendarManager.CalendarList()
      const scrollContainer = CalendarList.getScrollContainer()

      overlay.show()

      await scan(scrollContainer, opts, async function detect_calendars(){
        console.log('current scroll position:', scrollContainer.scrollTop)

        // wait for dom to render
        await sleep(100)

        const cals = CalendarManager.getVisibleOtherCalendars()

        console.log('currently see:', cals.map(c=>c.name))

        for(let cal of cals){
          await cal.saveScrollPosition()
          calendars.push(cal)
        }
      })

      overlay.hide()

      console.log('all calendars', calendars.map(cal => cal.name))
      return calendars
    }
  }

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
      // var names = CM.groups[group_name.toLowerCase()];
      // if(!names) {
      //   console.error('group not found:', group_name);
      //   return [];
      // }

      // return calendars
      //   .filter(c => names.indexOf(c.name) >= 0)
      //   // .op(CM.addAlwaysEnabledCalendars())

      var names = CM.groups[group_name.toLowerCase()];
      if(!names) {
        console.error('group not found:', group_name);
        return [];
      }

      return c => names.indexOf(c.name) >= 0
        // .op(CM.addAlwaysEnabledCalendars())
    },

    getCalendarsNotInGroup: function(group_name){
      var names = CM.groups[group_name.toLowerCase()];
      if(!names) {
        console.error('group not found:', group_name);
        return [];
      }

      return c => names.indexOf(c.name) < 0

      // return calendars
      //   .filter(c => names.indexOf(c.name) < 0)
    },

    enableGroup: async function(group_name){
      return calendars.enable(CM.getCalendarsForGroup(group_name))
    },

    disableNonGroup: async function(group_name){
      return calendars.disable(CM.getCalendarsNotInGroup(group_name))
    },

    showGroup: async function(group_name){
      // CM.disableAll();
      // setTimeout(() => {
        var enabled = await CM.enableGroup(group_name);
        // console.log('enabled:', group_name, '=>', enabled.map(c => c.name));
      // }, 1000);

      await CM.disableNonGroup(group_name);
    },

    disableGroup: async function(group_name){
      return calendars.disable(CM.getCalendarsForGroup(group_name))

      // return CM.getCalendarsForGroup(group_name)
      //   .filter(c => c.disable())
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
      calendars.enable(c => c.name.match(re))
    },

    disableUser: function(name){
      // name is a regex string
      var re = RegExp(name, 'i');
      calendars.disable(c => c.name.match(re));
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
  CM.CalendarDOM = CalendarDOM
  CM.CalendarList = CalendarList
  CM.Overlay = Overlay

  window.CalendarManager = window.CalendarManager || CM;
  console.log('CalendarManager loaded');
})();

const calendars = new CalendarManager.CalendarList()
CalendarManager.calendars = calendars

const overlay = new CalendarManager.Overlay(CalendarManager.CalendarList.getScrollContainer(), {
  disabled: true // disable for now since we're doing animation
})
CalendarManager.overlay = overlay

async function scan(el, opts, scrollIncrementedCb){
  let savedPosition = el.scrollTop
  await scrollElementTo(el, 0)

  await scrollThroughElement(el, opts, scrollIncrementedCb)
  console.log('done scanning')

  // if true, revert to original scroll position after the scan
  if(opts.restoreOriginalScroll){
    await scrollElementTo(el, savedPosition)
  }
}

function sleep(ms){
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

async function scrollElementTo(el, scrollTop, opts = {}){
  opts = Object.assign({animate: true, animateDuration: 500}, opts)

  return new Promise((resolve, reject) => {
    console.log('scrolling to:', scrollTop)

    jQuery(el).animate({
      scrollTop: scrollTop
    }, {
      duration: opts.animate ? opts.animateDuration : 0,
      complete: ()=>{
        console.log('scroll to', scrollTop, 'complete')
        resolve()
      },
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

async function scrollThroughElement(el, opts = {}, scrollIncrementedCb){
  opts = Object.assign({scrollIncrement: 50}, opts)

  while(el.scrollTop < (el.scrollHeight - el.clientHeight)){
    await scrollElementTo(el, el.scrollTop + opts.scrollIncrement, {animate: false})

    if(typeof scrollIncrementedCb == 'function'){
      await scrollIncrementedCb()
    }
  }

  // do one last scan
  if(typeof scrollIncrementedCb == 'function'){
    await scrollIncrementedCb()
  }
}


async function test1(){
  console.log('starting test1')
  for(let cal of calendars){
    console.log('toggling', cal.name)
    await calendars.toggle(cal, {restoreScroll: false})
    console.log('toggled', cal.name)
    await sleep(1000)
  }
  console.log('done test1')
}

async function test2(){
  console.log('starting test2')
  console.log('toggling all calendars')

  await calendars.toggleAll(calendars)

  console.log('done toggling all calendars')
  console.log('done test2')
}


// TODOs:
// - properly save and restore

