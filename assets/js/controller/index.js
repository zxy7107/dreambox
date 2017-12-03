require(['jquery', 'lodash', 'moment', 'vue', 'expense', 'income', 'transfer', 'allocate', 'dreamobj', 'target', 'accounting', '_'], function($, lodash, moment, Vue, expense, income, transfer, allocate, dreamobj, target, accounting) {
    // console.log(expense)
    // console.log(income)
    // console.log(transfer)
    // console.log(allocate)
    // console.log(target)
    new Vue({
        el: '#main',
        data: {
            categoryArray: ['quarterly', 'annual', 'once', 'longterm', 'monthly', 'decoration'],
            expense: expense,
            income: income,
            transfer: transfer,
            allocate: allocate,
            target: target,
            spliterDate: '',
            initialDate: '2016-01-10',
            quarterlyRange: [],
            annualRange: [],
            monthlyRange: [],
            projectsNames: {
                // quarterly: [],
                // annual: [],
                // once: [],
                // longterm: [],
                // monthly: [],
            },
            projects: {
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
            // netAsset: 361304.18,//
            // netAsset: 351914.91,//
            // netAsset: 355949.98,//11-10 11月初预算 
            netAsset: 349789.58,//12-3  
            accounting: accounting

        },
        computed: {
            dreamObj: function(){
                var tmp = {};
                _.each(dreamobj, function(v,k) {
                        if(v[0] !== '项目') {
                            tmp[v[0]] = {
                                target: '',
                                category: v[1],
                                deadline: v[2],
                                status: v[3],
                                totalAllocated: parseFloat(v[4]),
                                totalDrawed: parseFloat(v[5]),
                                balance: 0,
                                gap: 0
                            }

                        }
                    })
                return tmp;
            },
            dreamList: function() {
                var self = this;

                _.each(self.categoryArray, function(v,k) {
                    _.each(['expense', 'allocate'], function(v1,k1) {
                        var direction = '';
                        switch(v1) {
                            case 'expense':
                                direction = 'totalDrawed';
                                break;
                            case 'allocate':
                                direction = 'totalAllocated';
                                break;
                            default:
                                break;
                        }
                        self.calculateTotalAmount(v, v1, direction);
                    })
                    self.attachTarget(v)

                })
                var tmp = {}
                $.each(self.dreamObj, function(k, v) {
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
                moment(self.initialDate).add("22", "M").format("YYYY-MM-DD"),
                moment(self.initialDate).add("23", "M").format("YYYY-MM-DD")
            ];

            _.each(self.categoryArray,function(v,k){
                self.collectProjectsNames(v)
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
                        $.each(self.projects[item.category]['expense'][item.name], function(k,v){
                            console.log('·' + v[5] + ' - ' + v[9].replace(/\d\d:\d\d:\d\d/,'') + ' - ' + v[10])
                        })
                        break;
                    case 'allocate':
                        $.each(self.projects[item.category]['allocate'][item.name], function(k,v){
                            console.log(v[1] + ' - ' + v[3])
                        })
                        break;
                    default:
                        break;
                }
                
            },
            collectProjectsNames: function(category) {
                var self = this;
                _.each(self.dreamObj, function(v, k) {
                    if (_.isMatch(v, { category: category })) {
                        if(self.projectsNames[category] == void(0)) {
                            self.projectsNames[category] = [];
                        } 
                        self.projectsNames[category].push(k)
                    }
                })
            },
            calculateTotalAmount: function(category, dataType, direction) {
                var self = this;
                var index = '';
                switch(dataType) {
                    case 'expense':
                        // index = 9;
                        index = 5;//金额：第6列
                        break;
                    case 'allocate':
                        index = 3;
                        break;
                    default:
                        break;
                }
                _.each(self.projects[category][dataType], function(v,k) {
                    self.dreamObj[k][direction]  += _.reduce(v, function(memo, item) {
                        return memo + parseFloat(item[index]);
                    }, 0);

                    self.dreamObj[k]['balance'] = self.dreamObj[k]['totalAllocated'] -  self.dreamObj[k]['totalDrawed'];
                    
                })


            },
            attachTarget: function(category){
                var self = this;
                _.each(self.projects[category]['target'], function(v,k) {
                    self.dreamObj[k]['target']  = parseFloat(v[v.length-1][2])
                    self.dreamObj[k]['gap']  = self.dreamObj[k]['target'] - self.dreamObj[k]['totalAllocated']

                })
            },
            divideRecordsByCategory: function(dataType, category, rangeStart, rangeEnd) {
                var self = this;
                var projectNameIndex = '';
                switch (dataType) {
                    case 'allocate':
                        projectNameIndex = 2;
                        dateIndex = 1;
                        break;
                    case 'expense':
                        // projectNameIndex = 6; 
                        projectNameIndex = 8; //项目：对应excel表中第9列
                        // dateIndex = 1;
                        dateIndex = 9;//日期：第10列
                        break;
                    case 'target':
                        projectNameIndex = 1;
                        dateIndex = 0;
                        break;
                    default:
                        break;
                }
                var projects = _.groupBy(self[dataType], function(v) {
                    return v[projectNameIndex];
                });
                if (dataType == 'expense') {
                    projects['本月非项目支出（日常消费）预算'] = projects[''];
                    // projects = _.omit(projects, '');
                    // console.log(projects['本月非项目支出（日常消费）预算'])
                    projects = _.omit(projects, '项目');
                }


                projects = _.pick(projects, self.projectsNames[category])
                var tmp = {};
          
                if(rangeStart && rangeEnd) {
                   _.each(projects, function(v, k) {
                    var a = _.filter(v, function(v1) {

                        return moment(v1[dateIndex]).isBetween(rangeStart, rangeEnd, null, '[)')
                    })
                    
                    if (a.length) tmp[k] = a;
                })  
               } else {
                tmp = projects;
               }
               
                if(category == 'quarterly') {
                    console.log(tmp)
                }
                self.projects[category][dataType] = tmp;

            },
            
        }
    })
})