var excelParser = require('excel-parser');
var path = require('path');
var fs = require('fs');
    excelParser.parse({
        inFile: './myMoney1.xls',
        worksheet: 5,
        skipEmpty: false,
        searchFor: {
            type:'loose'
        }
    },function(err, records){
        // if(err){
        //     return callback(err,null);
        // }
        //delete records[0];
        // return callback(null, records);
        console.log(err);
        console.log(JSON.stringify(records))
        var res = 'var data = ' + JSON.stringify(records);
        fs.writeFile('./assets/js/data/transfer.js', res)
        });

