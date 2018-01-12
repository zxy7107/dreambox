require(['jquery',  'moment', 'vue', 'expense', 'income', 'transfer', 'allocate', 'dreamobj', 'target', 'netasset', 'accounting','components/ui', '_'], 
        function($, moment, Vue, expense, income, transfer, allocate, dreamobj, target, netasset, accounting, ui) {
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
            spliterDate: '',
            initialDate: '2016-01-10',
            quarterlyRange: [],
            annualRange: [],
            monthlyRange: [],
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
            accounting: accounting
        },
        computed: {
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
                tmp = _.uniq(tmp);
                // ["longterm", "decoration", "annual", "once", "quarterly", "monthly"]
                return tmp;//去重
            },
            netassetoptions: function(){
                var self = this;
                var tmp = [];
                _.each(self.netasset, function(item,k) {
                    tmp.push({
                        value: item[1],
                        text: moment(item[0]).format('YYYY-MM -DD ') + '   ' + item[1]
                    })
                })
                return tmp;
            },
            dreamItem: function(){
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
            },
            dreamItemArray: function(){
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
                console.log(self.dreamItem)
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

            self.spliterDate = moment({})
            self.quarterlyRange = [
                moment(self.initialDate).add("7", "Q").format("YYYY-MM-DD"),
                moment(self.initialDate).add("8", "Q").format("YYYY-MM-DD")

            ];
            self.annualRange = [
                moment(self.initialDate).add("1", "y").format("YYYY-MM-DD"),
                moment(self.initialDate).add("2", "y").format("YYYY-MM-DD")
            ];

            self.monthlyRange = [
                moment(self.initialDate).add("23", "M").format("YYYY-MM-DD"),
                moment(self.initialDate).add("24", "M").format("YYYY-MM-DD")
            ];

            _.each(self.categoryName,function(v,k){
                var rangeStart = '', rangeEnd = '';
                switch(v) {
                    case 'quarterly': 
                        rangeStart = self.quarterlyRange[0];
                        rangeEnd = self.quarterlyRange[1];
                        break;
                    case 'annual': 
                        rangeStart = self.annualRange[0];
                        rangeEnd = self.annualRange[1];
                        break;
                    case 'monthly':
                        rangeStart = self.monthlyRange[0];
                        rangeEnd = self.monthlyRange[1];
                        break;
                    case 'once': 
                    case 'longterm': 
                        rangeStart = '';
                        rangeEnd = '';
                        break;
                    default: 
                        break;
                }
                
                
                _.each(['allocate', 'expense', 'target'], function(v1, k1) {
                    self.divideRecordsByCategory(v1, v, rangeStart, rangeEnd);

                })

            })


        },
        methods: {
            changeNetasset: function(ui){
                var self = this;
                self.netAsset = ui.item.value;
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
            divideRecordsByCategory: function(dataType, category, rangeStart, rangeEnd) {
                var self = this;
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