// var excelParser = require('excel-parser');
// var path = require('path');
// var fs = require('fs');
    // excelParser.parse({
    //     inFile: './allocateRecord.xls',
    //     worksheet: 2,
    //     skipEmpty: false,
    //     searchFor: {
    //         type:'loose'
    //     }
    // },function(err, records){
    //     // if(err){
    //     //     return callback(err,null);
    //     // }
    //     //delete records[0];
    //     // return callback(null, records);
    //     console.log(err);
    //     console.log(JSON.stringify(records))
    //     var res = 'var data = ' + JSON.stringify(records);
    //     fs.writeFile('./assets/js/data/dreamobj.js', res)
    //     });

var fs = require('fs');
var parseXlsx = require('excel');

parseXlsx('./allocateRecordxlsx.xlsx', '2', function(err, records) {
    if(err) throw err;
    // data is an array of arrays
    console.log(JSON.stringify(records))
    var res = 'var data = ' + JSON.stringify(records);
    fs.writeFile('./assets/js/data/dreamobj.js', res)
});