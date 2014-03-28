'use strict';

var bayes = require('./optimal-bayes'),
	winston = require('winston'),
	csv = require('csv'),
	fs = require('fs'),
	_ = require('lodash');


var fileName;
if (process.argv.length <= 2) {
	winston.error('Filename argument required');
	return;
}
else if (process.argv[1] === 'debug') {
	fileName = process.argv[3];
}
else fileName = process.argv[2];

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
		var trainingSet = getTrainingSet(dataSet);
		var testingSet = getTestingSet(dataSet);

		var partitions = {};

		// grab categories
		var categories = getCategories(dataSet);

		// create a partition for each category
		categories.forEach(function(category) {
			partitions[category] = { data: [], meanVector: {} };
			partitions[category].data = getAllDataForCategory(trainingSet, category);
			partitions[category].meanVector =  getMeanVector(partitions[category].data);
		});
	})
	.on('error', function(error){
		winston.error('Error parsing CSV file: ' + error.message );
	});

var getCategories = function(dataSet) {
	var categories = [];

	dataSet.forEach(function(data) {
		if (categories.indexOf(data.category) === -1)
			categories.push(data.category);
	});

	return categories;
};

var getTrainingSet = function(dataSet) {
	return dataSet.slice(0,dataSet.length/2);
};

var getTestingSet = function(dataSet) {
	return dataSet.slice(dataSet.length/2, dataSet.length);
};

var getAllDataForCategory = function(dataSet, category) {
	var dataForCategory = [];

	dataSet.forEach(function(data) {
		if (data.category === category) {
			// trim off the last field, the category name
			// delete data.category;

			dataForCategory.push(data);
		}
	});

	if (dataForCategory.length === 0) debugger;

	return dataForCategory;
};

var getMeanVector = function(data) {
	var vector = {};

	// sum all data point categories
	data.forEach(function(d) {
		for (var key in d) {
			if (typeof(vector[key]) === 'undefined') vector[key] = 0;
			vector[key] += Number(d[key]);
		}
	});

	// average them out
	for (var key in vector) {
		vector[key] /= data.length;
	}

	return vector;
};