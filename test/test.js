/*jslint node: true */
'use strict';

var	winston = require('winston'),
	csv = require('csv'),
	prompt = require('prompt'),
	testFunctions = require('./test-functions');

prompt.get(['filename', 'primary-category', 'bayes-type'], function(err, result) {
	var primaryCategory = result['primary-category'];
	var bayesType = result['bayes-type'];

	var headerline = [];
	var dataSet = [];

	// read in file
	csv()
		.from.path(__dirname + '/data/' + result.filename + '.csv', { delimeter: ',', escape: '' })
		.on('record', function(row,index) {
			var i;
			var data = {};

			// First row will be the headerline
			if (index === 0) {
				for (i = 0; i < row.length; i++) headerline.push(row[i]);
			}
			else {
				// Populate fields from csv
				for (i = 0; i < row.length; i++) data[headerline[i]] = row[i];

				dataSet.push(data);
			}
		})
		.on('end', function(){
			var result = testFunctions.runClassifier(dataSet, primaryCategory, bayesType);

			winston.info('NumCorrect: ' + result.numCorrect + ', NumWrong: ' + result.numWrong + ', Percent: ' + result.percentCorrect + '%');
		})
		.on('error', function(error){
			winston.error('Error parsing CSV file: ' + error.message );
		});
});