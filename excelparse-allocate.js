// var excelParser = require('excel-parser');
// var path = require('path');
var fs = require('fs');
//     excelParser.parse({
//         // inFile: './allocateRecord.xls',
//         inFile: './allocateRecordxlsx.xlsx',
//         worksheet: 1,
//         skipEmpty: false,
//         searchFor: {
//             type:'loose'
//         }
//     },function(err, records){
//         // if(err){
//         //     return callback(err,null);
//         // }
//         //delete records[0];
//         // return callback(null, records);
//         console.log(err);
//         console.log(JSON.stringify(records))
//         var res = 'var data = ' + JSON.stringify(records);
//         fs.writeFile('./assets/js/data/allocate.js', res)
//         });

var parseXlsx = require('excel');

parseXlsx('allocateRecordxlsx.xlsx', '1', function(err, records) {
    if(err) throw err;
    // data is an array of arrays
    console.log(JSON.stringify(records))
    var res = 'var data = ' + JSON.stringify(records);
    fs.writeFile('./assets/js/data/allocate.js', res)
});