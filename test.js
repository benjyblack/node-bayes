'use strict';

var bayes = require('./optimal-bayes'),
	winston = require('winston'),
	csv = require('csv'),
	fs = require('fs'),
	_ = require('lodash');


if (process.argv.length <= 2) {
	winston.error('Filename argument required');
	return;
}

var fileName = process.argv[2];

var headerline = [];
var dataSet = [];

// read in file
csv()
	.from.path(__dirname + '/data/' + fileName + '.csv', { delimeter: ',', escape: '' })
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
		// initialize classifier
		var classifer = bayes();

		// initialize data sets
		var length = dataSet.length;
		var trainingSet = dataSet.slice(0,length/2);
		var testingSet = dataSet.slice(length/2, length);

	})
	.on('error', function(error){
		winston.error('Error parsing CSV file: ' + error.message );
	});