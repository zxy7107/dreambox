define(function(){
    var date = {};
    date.datepicker = {
        template:'<input type="text" placeholder="请选择"/>',
        props: {
            id: {
                type: String,
                required: false,
                default: false
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
            var datePickerOpt = _.extend(self.option, {
                onSelect: function(dateText){
                    self.$emit('change', dateText, self.id);
                }
            });
            $(self.$el).datepicker(datePickerOpt);

        }
    }
    date.timepicker = {
        template:'<input type="text" placeholder="请选择"/>',
        props: {
            id: {
                type: String,
                required: false,
                default: false
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
            var timePickerOpt = _.extend(self.option, {
                event: {
                    refer:function(res){
                        self.$emit('change', res.placeholder, self.id)
                    }
                }
            });

            $(self.$el).iCalendar(timePickerOpt);
        }
    };
    
    
    return date;
})
    
