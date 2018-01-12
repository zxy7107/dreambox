require(['jquery',  'moment', 'vue', 'expense', 'income', 'transfer', 'allocate', 'dreamobj', 'target', 'netasset', 'accounting','components/ui', '_'], 
        function($, moment, Vue, expense, income, transfer, allocate, dreamobj, target, netasset, accounting, ui) {
    window.moment = moment;
    // console.log(expense)
    // console.log(income)
    // console.log(transfer)
    // console.log(allocate)
    // console.log(target)
    // console.log(netasset)
    // console.log(dreamobj) //梦想概要（如类型、截止日期等）
    dreamobj.shift();
    // records:
    expense.shift();
    allocate.shift();
    target.shift();
    netasset.shift();
    //净资产 = 收入-支出+余额变更-负债变更
    
    var initialDate =  '2016-01-10';
    var config = {
        allocate: {
            projectNameIndex: 2,
            dateIndex: 1,
            moneyIndex: 3,
            account: 'totalAllocated',
        },
        expense: {
            projectNameIndex: 8, //项目：对应excel表中第9列
            dateIndex: 9,//日期：第10列
            moneyIndex: 5,//金额：第6列
            account: 'totalDrawed',
        },
        target: {
            projectNameIndex: 1,
            dateIndex: 0,
            moneyIndex: 2,
            account: 'target',
        },
    }

var resetDreamItem = function(){
                // var tmp = {};
                var tmp = [];
                //数组dreamobj转成对象
                _.each(dreamobj, function(v,k) {
                    var obj = _.object(['itemName', 'category', 'deadline', 'status', 'totalAllocated', 'totalDrawed'], v);
                    tmp.push(_.extend(obj, {
                        totalAllocated: parseFloat(v[4]), //初始分配额
                        totalDrawed: parseFloat(v[5]),//初始支取额
                        target: '',
                        balance: 0, //余额
                        gap: 0 //还需累积 / 超支
                    }))
                })
                tmp = _.indexBy(tmp, 'itemName');
                // {
                //     "1年半21+10w（2018-1-9）":{
                //         "itemName":"1年半21+10w（2018-1-9）",
                //         "category":"longterm",
                //         "deadline":"",
                //         "status":"",
                //         "totalAllocated":0,
                //         "totalDrawed":0,
                //         "target":"",
                //         "balance":0,
                //         "gap":0
                //     },
                //     "新房装修":{
                //         "itemName":"新房装修",
                //         "category":"decoration",
                //         "deadline":"43252",
                //         "status":"",
                //         "totalAllocated":0,
                //         "totalDrawed":0,
                //         "target":"",
                //         "balance":0,
                //         "gap":0
                //     }
                // }
                return tmp;
            };

    new Vue({
        el: '#main',
        data: {
            
            expense: expense,
            income: income,
            transfer: transfer,
            allocate: allocate,
            target: target,
            netasset: netasset,
            netAsset: 0,
            dateSelected: '',
            spliterDate: '',
            records: {
                quarterly: {
                    expense: {},
                    allocate: {},
                    target: {}
                },
                annual: {
                    expense: {},
                    allocate: {},
                    target: {}
                },
                once: {
                    expense: {},
                    allocate: {},
                    target: {}
                },
                longterm: {
                    expense: {},
                    allocate: {},
                    target: {}
                },
                monthly: {
                    expense: {},
                    allocate: {},
                    target: {}
                },
                decoration: {
                    expense: {},
                    allocate: {},
                    target: {}
                }

            },
            dreamItem: resetDreamItem(),
            accounting: accounting,
            rangeStart: {
                    quarterly: moment(initialDate).add("7", "Q").format("YYYY-MM-DD"),
                    annual:moment(initialDate).add("1", "y").format("YYYY-MM-DD"),
                    monthly: moment(initialDate).add("23", "M").format("YYYY-MM-DD"),
                    once: '',
                    longterm: ''
                },
                rangeEnd: {
                    quarterly: moment(initialDate).add("8", "Q").format("YYYY-MM-DD"),
                    annual:moment(initialDate).add("2", "y").format("YYYY-MM-DD"),
                    monthly: moment(initialDate).add("24", "M").format("YYYY-MM-DD"),
                    once: '',
                    longterm: ''
                }
        },
        computed: {

            standardDay: function(){
                var self = this;
                return moment(self.dateSelected).startOf('month').add(9,'days').format('YYYY-MM-DD');
            },
            duration: function(){
                var self = this;
                return moment(self.standardDay).diff(initialDate, 'month', true);
            },
            month: function(){
                var self = this;
                return moment(self.dateSelected).isBefore(self.standardDay) ?  self.duration-1 : self.duration;
            },
            year: function(){
                var self = this;
                var tmp = Math.floor(self.duration/12);
                return moment(self.dateSelected).isBefore(self.standardDay) ?  tmp-1 : tmp;;
            },
            quarter: function(){
                var self = this;
                var tmp = Math.floor(self.duration/3);
                return moment(self.dateSelected).isBefore(self.standardDay) ?  tmp-1 : tmp;;
            },
            dreamItemNameByCategory: function(){
                var self = this;
                var tmp = {};
                var category = _.groupBy(dreamobj, function(v){
                    return v[1];
                })
                _.each(category, function(v,k) {
                    tmp[k] = [];
                    _.each(v, function(vv,kk) {
                        tmp[k].push(vv[0])
                    })
                })
                return tmp;
            },
            
            categoryName: function(){
                var self = this;
                var tmp = _.unzip(dreamobj)[1];
                tmp = _.uniq(tmp);//去重
                return tmp;// ["longterm", "decoration", "annual", "once", "quarterly", "monthly"]
            },
            netassetoptions: function(){
                var self = this;
                var tmp = [];
                _.each(self.netasset, function(item,k) {
                    tmp.push({
                        value: item[1],
                        text: moment(item[0]).format('YYYY-MM -DD ') + '   ' + item[1],
                        date: item[0]
                    })
                })
                return tmp;
            },

            
            dreamList: function() {
                var self = this;
                _.each(self.categoryName, function(category,k) {
                    //计算每个dreamItem在对应周期内的expense和allocate总和
                    self.calculateTotalAmount(category, 'expense');
                    self.calculateTotalAmount(category, 'allocate');
                    //在每个dreamItem中添加对应周期内的target值
                    self.updateTargetInDreamItem(category, 'target')
                })
                var tmp = {}
                $.each(self.dreamItem, function(k, v) {
                    if (!tmp[v['category']]) {
                        tmp[v['category']] = [];
                    }
                    v['name'] = k;
                    tmp[v['category']].push(v)
                })
                return tmp;

            },
            totalBalance: function(){
                var self = this;
                var total = 0;
                _.each(self.dreamList, function(v,k) {
                   total += _.reduce(v, function(memo, item){
                    return memo + item['totalAllocated'] - item['totalDrawed']
                }, 0); 
                })
                return total;
            }

        },
        components: {
            // 'datepicker': date.datepicker,
            'selectmenu': ui.selectmenu
        },
        mounted: function() {
            var self = this;
            
            self.calculateRangeStart();
            self.calculateRangeEnd();
            self.spliterDate = moment({})
            self.divideRecords();

        },
        methods: {
            
            divideRecords: function(){
                var self = this;
                _.each(self.categoryName,function(v,k){
                    self.divideRecordsByCategory('allocate', v)
                    self.divideRecordsByCategory('expense', v)
                    self.divideRecordsByCategory('target', v)
                })
                // console.log(JSON.stringify(self.records));
            },
            calculateRangeStart: function(){
                var self = this;
                console.log(self.month)
                console.log(self.quarter)
                console.log(self.year)
                self.rangeStart = {
                    quarterly: moment(initialDate).add(self.quarter, "Q").format("YYYY-MM-DD"),
                    annual:moment(initialDate).add(self.year, "y").format("YYYY-MM-DD"),
                    monthly: moment(initialDate).add(self.month, "M").format("YYYY-MM-DD"),
                    once: initialDate,
                    longterm: initialDate
                }
            },
            calculateRangeEnd: function(){
                var self = this;
                // self.rangeEnd = {
                //     quarterly: moment(initialDate).add(self.quarter+1, "Q").subtract(1,'days').format("YYYY-MM-DD"),
                //     annual:moment(initialDate).add(self.year+1, "y").subtract(1,'days').format("YYYY-MM-DD"),
                //     monthly: moment(initialDate).add(self.month+1, "M").subtract(1,'days').format("YYYY-MM-DD"),
                //     once: '',
                //     longterm: ''                
                // }
                var endDay = moment(self.dateSelected).add(1,'days').format("YYYY-MM-DD");
                self.rangeEnd = {
                    quarterly: endDay,
                    annual: endDay,
                    monthly: endDay,
                    once: endDay,
                    longterm: endDay                
                }
                console.log('month: [' + self.rangeStart['monthly'] + '--' +  self.rangeEnd['monthly'] + ')')
                console.log('quarter: [' + self.rangeStart['quarterly'] + '--' +  self.rangeEnd['quarterly'] + ')')
                console.log('year: [' + self.rangeStart['annual'] + '--' +  self.rangeEnd['annual'] + ')')
                console.log('once: [' + self.rangeStart['once'] + '--' +  self.rangeEnd['once'] + ')')
                console.log('longterm: [' + self.rangeStart['longterm'] + '--' +  self.rangeEnd['longterm'] + ')')
            },
            changeNetasset: function(ui){
                var self = this;
                self.netAsset = ui.item.value;
                
                var tmp = _.filter(self.netassetoptions, function(netassetObj){
                    return netassetObj.value == self.netAsset;
                })
                self.dateSelected = tmp[0].date;
                self.dreamItem = resetDreamItem();
                self.calculateRangeStart();
                self.calculateRangeEnd();
                self.divideRecords();
            },
            /**
             * 点击td显示记录明细（累积支取额，累积分配额）
             * @param  {[type]} item     [description]
             * @param  {[type]} dataType [description]
             * @return {[type]}          [description]
             */
            showRecords: function(item, dataType) {
                var self = this;
                switch(dataType) {
                    case 'expense':
                        $.each(self.records[item.category]['expense'][item.name], function(k,v){
                            // console.log('·' + v[5] + ' - ' + v[9].replace(/\d\d:\d\d:\d\d/,'') + ' - ' + v[10])
                        })
                        break;
                    case 'allocate':
                        $.each(self.records[item.category]['allocate'][item.name], function(k,v){
                            // console.log(v[1] + ' - ' + v[3])
                        })
                        break;
                    default:
                        break;
                }
                
            },
            calculateTotalAmount: function(category, dataType) {
                var self = this;
                //计算
                // records :
                //      annual
                //            expense
                //                  Y/保险
                //                  Y/新年礼物
                //            allocate    
                //            target    
                _.each(self.records[category][dataType], function(v,k) {
                    self.dreamItem[k][config[dataType].account]  += _.reduce(v, function(memo, item) {
                        return memo + parseFloat(item[config[dataType].moneyIndex]);
                    }, 0);

                    self.dreamItem[k]['balance'] = self.dreamItem[k]['totalAllocated'] -  self.dreamItem[k]['totalDrawed'];
                    // console.log(JSON.stringify(self.dreamItem))
                })
                // console.log(JSON.stringify(self.records))


            },
            updateTargetInDreamItem: function(category, dataType){
                var self = this;
                _.each(self.records[category]['target'], function(v,k) {
                    self.dreamItem[k][config[dataType].account]  = parseFloat(_.flatten(v)[config[dataType].moneyIndex])
                    self.dreamItem[k]['gap']  = self.dreamItem[k]['target'] - self.dreamItem[k]['totalAllocated']
                })
            },
            divideRecordsByCategory: function(dataType, category) {
                var self = this;
                var rangeStart = self.rangeStart[category]
                var rangeEnd = self.rangeEnd[category]
                var records = _.groupBy(self[dataType], function(v) {
                    return v[config[dataType].projectNameIndex];
                });
                if (dataType == 'expense') {
                    records['本月非项目支出（日常消费）预算'] = records[''];
                }

                records = _.pick(records, self.dreamItemNameByCategory[category])

                var tmp = {};
            
                if(rangeStart && rangeEnd) {
                   _.each(records, function(v, k) {
                    var a = _.filter(v, function(v1) {
                        return moment(v1[config[dataType].dateIndex]).isBetween(rangeStart, rangeEnd, null, '[)')
                    })
                    
                    if (a.length) tmp[k] = a;
                })  
               } else {
                tmp = records;
               }
               
                if(category == 'quarterly') {
                    // console.log(tmp)
                }
                self.records[category][dataType] = tmp;
            },
            
        }
    })
})