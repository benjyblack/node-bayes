/*jslint node: true */
'use strict';

var bayes = require('./bayes'),
	winston = require('winston'),
	csv = require('csv'),
	_ = require('lodash');


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

		// shuffle dataSet
		dataSet = shuffle(dataSet);

		// get all categories
		var categories = getCategories(dataSet);

		// check to make sure the primary category entered from command line is actually one of the categories
		if (categories.indexOf(categoryToCompare) === -1) {
			winston.error('Given class does not exist.');
			return;
		}

		// initialize data sets
		var trainingSet = dataSet.slice(0,dataSet.length/2);
		var testingSet = dataSet.slice(dataSet.length/2, dataSet.length);

		// get the data for the primary category and for the secondary category
		var categoryToCompareData = getAllDataForCategory(trainingSet, categoryToCompare);
		
		var otherCategoryData = [];
		categories.forEach(function(category) {
			if (category !== categoryToCompare) {
				otherCategoryData = otherCategoryData.concat(getAllDataForCategory(trainingSet, category));
			}
		});

		// initialize classifier
		var classifier = bayes();

		// teach the classifier about the data
		classifier.teachPrimaryCategory(categoryToCompareData);
		classifier.teachSecondaryCategory(otherCategoryData);

		var numCorrect = 0;
		var numWrong = 0;

		testingSet.forEach(function(dataPoint) {
			var c = classifier.classify(dataPoint);

			if (c > 0) {
				if (dataPoint.category === categoryToCompare) numCorrect++;
				else numWrong++;
			}
			else {
				if (dataPoint.category !== categoryToCompare) numCorrect++;
				else numWrong++;
			}
		});

		winston.info('NumCorrect: ' + numCorrect + ', NumWrong: ' + numWrong + ', Percent: ' + numCorrect/testingSet.length*100 + '%');
	})
	.on('error', function(error){
		winston.error('Error parsing CSV file: ' + error.message );
	});

var shuffle = function (array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

var getCategories = function(dataSet) {
	var categories = [];

	dataSet.forEach(function(data) {
		if (categories.indexOf(data.category) === -1)
			categories.push(data.category);
	});

	return categories;
};

var getAllDataForCategory = function(dataSet, category) {
	var dataForCategory = [];

	dataSet.forEach(function(data) {
		if (data.category === category) {
			// trim off the last field, the category name
			delete data.category;

			var vector = [];

			for (var item in data) {
				vector.push(Number(data[item]));
			}

			dataForCategory.push(vector);
		}
	});

	return dataForCategory;
};