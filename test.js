'use strict';

var bayes = require('./optimal-bayes'),
	winston = require('winston'),
	csv = require('csv'),
	fs = require('fs'),
	_ = require('lodash'),
	mathjs = require('mathjs'),
	math = mathjs();


var fileName, categoryToCompare;
if (process.argv.length <= 3) {
	winston.error('Filename and class arguments required');
	return;
}
else if (process.argv[1] === 'debug') {
	fileName = process.argv[3];
	categoryToCompare = process.argv[4];
}
else {
	fileName = process.argv[2];
	categoryToCompare = process.argv[3];
}

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
		var k = getK(dataSet);

		if (categories.indexOf(categoryToCompare) === -1) {
			winston.error('Given class does not exist.');
			return;
		}

		// Assembled categoryToCompare partition
		partitions[categoryToCompare] = { data: [], meanVector: {} };
		partitions[categoryToCompare].data = getAllDataForCategory(trainingSet, categoryToCompare);
		partitions[categoryToCompare].meanVector =  getMeanVector(partitions[categoryToCompare].data);
		partitions[categoryToCompare].covarianceMatrix = buildCovarianceMatrix(partitions[categoryToCompare]);

		// Assemble other partition
		partitions.other = { data: [], meanVector: {} };
		categories.forEach(function(category) {
			if (category !== categoryToCompare) {
				partitions.other.data = partitions.other.data.concat(getAllDataForCategory(trainingSet, category));
			}
		});
		partitions.other.meanVector =  getMeanVector(partitions.other.data);
		partitions.other.covarianceMatrix = buildCovarianceMatrix(partitions.other);


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

var getK = function(dataSet) {
	var sample = dataSet[0];
	// subtract 1 because one of the data points is the category itself
	return Object.keys(sample).length - 1;
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
			delete data.category;

			var vector = [];

			for (var item in data) {
				vector.push(data[item]);
			}

			dataForCategory.push(vector);
		}
	});

	return dataForCategory;
};

var getMeanVector = function(dataSet) {
	var vector = [];

	// sum all data point categories
	dataSet.forEach(function(dataPoint) {
		for (var i = 0; i < dataPoint.length; i++) {
			if (typeof(vector[i]) === 'undefined') vector[i] = 0;
			vector[i] += Number(dataPoint[i]);
		}
	});

	// average them out
	for (var i = 0; i < vector.length; i++)
	{
		vector[i] /= dataSet.length;
	}

	return vector;
};

var buildCovarianceMatrix = function(partition) {
	var covarianceMatrix = math.eval('zeros(k,k)', { k: k });


	// partition.data.forEach(function(dataPoint) {

	// });

	return covarianceMatrix;
};

var subtractVectors = function(a, b) {
	var result = {};

};