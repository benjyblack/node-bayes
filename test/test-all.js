/*jslint node: true */
'use strict';

var winston = require('winston'),
	csv = require('csv'),
	testFunctions = require('./test-functions');

var files = [
	{
		filename: 'iris',
		categories: ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'],
		results: {}
	}, {
		filename: 'heartDisease',
		categories: ['0', '1', '2', '3', '4'],
		results: {}
	}, {
		filename: 'wine',
		categories: ['1', '2', '3'],
		results: {}
	}
];

var bayesTypes = ['optimal', 'naive'];

files.forEach(function (file) {
	var headerline = [];
	var dataSet = [];

	// read in file
	csv()
		.from.path(__dirname + '/data/' + file.filename + '.csv', { delimeter: ',', escape: '' })
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
			winston.info('File: %s', file.filename);

			bayesTypes.forEach(function (bayesType) {
				file.results[bayesType] = 0;
				file.categories.forEach(function (primaryCategory) {
					var result = testFunctions.runClassifier(dataSet, primaryCategory, bayesType);
					file.results[bayesType] += result.percentCorrect;
				});
				winston.info('Algorithm: %s, Average percent: %d%', bayesType,file.results[bayesType]/file.categories.length);
			});

			winston.info('\n');
		})
		.on('error', function(error){
			winston.error('Error parsing CSV file: ' + error.message );
		});
});