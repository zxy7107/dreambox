define(function(){
    var ui = {};
    ui.selectmenu = {
        template:[
            '<div>',
            '<label for="select">Select a file</label>',
            '<select name="select" :id="id">',
              // '<optgroup label="Scripts">',
                '<option v-for="tag in optiontags" :value="tag.value">{{tag.text}}</option>',
              // '</optgroup>',
            '</select>',
            '</div>'].join(''),
        props: {
            optiontags: {
                type: Array,
                required: true,
                default: []
            },
            id: {
                type: String,
                required: false,
                default: ''
            },
            option: {
                type: Object,
                required: false,
                default: function(){
                    return {}
                }
            }
        },
        mounted: function () {
            var self = this;
            var option = _.extend(self.option, {
                select: function( event, ui ) {
                    self.$emit('change', ui)
                }
            });
            $(self.$el).find('select').selectmenu(option);
        }
    }
    

    return ui;
})
    
