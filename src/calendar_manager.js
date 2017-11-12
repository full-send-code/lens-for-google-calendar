(function(){
  var $ = function(selector, startNode){
    return (startNode || document).querySelector(selector)
  };

  var CM = {
    groups: {
      et: ['Ahmed Albaiti', 'Myhanh Dao', 'Weston Headley'],
      normal: ["Ilya Braude", "Ahmed Albaiti", "Holidays in United States", "Jeff Gombala", "Julliette Ehlert", "Kalisha Narine", "Marlon Joseph", "Medullan Holidays", "Raghvendra Gupta", "Ryan Rossier", "Time Off", "Timothy Dwight", "Wesley Boland", "Weston Headley"],
      movers: ["Ahmed Albaiti", "Myhanh Dao", "Ryan Rossier", "Weston Headley", "Jeff Gombala"],
      clt: ["José Aponte", "Julliette Ehlert", "Raghvendra Gupta", "Ryan Rossier", "Todd Greenwood",  "Jeff Gombala"],
    },

    // used for loading groups from storage without changing the groups reference above
    setGroups: function(new_groups) {
      CM.groups = new_groups
      CM._updated()
    },

    // set CM.onGroupsChange function to get updates
    _updated: function(){
      if(typeof CM.onGroupsChange === 'function'){
        CM.onGroupsChange()
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
      };

      return controller
    },

    getOtherCalendarsElements: function(){
      return Array.from($("ol[aria-label='Other calendars']").querySelectorAll("li[role='listitem']"))
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
