var dropdown = [
  { text: 'Learn JavaScript', value: 'value', other: 'hi' },
  { text: 'Learn Vue' },
  { text: 'Build something awesome' }
]

var app = new Vue({
  el: '#app',
  data: {
    dropdown
  },
  methods: {
    select_input: function(value) {
      console.log('input', value)
      // console.log(this)
    },
    btn_user: function(event) {
      console.log('user', event)
    },
    btn_saveas: function(event) {
      console.log('saveas', event)
    },
    btn_restore: function(event) {
      console.log('restore', event)
        },
    btn_clear: function(event) {
      console.log('clear', event)
    },
  }
})


setTimeout(()=>{
  dropdown.push({text: 'another entry', value: 'another'})
}, 2000)
