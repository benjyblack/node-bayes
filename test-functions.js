/*jslint node: true */
'use strict';

var bayes = require('./bayes'),
	winston = require('winston');

var runClassifier = function(dataSet, primaryCategory, bayesType) {
	var trainingSet, testingSet, categories, primaryCategoryData, otherCategoryData;

	do {
		// shuffle dataSet
		dataSet = shuffle(dataSet);

		// get all categories
		categories = getCategories(dataSet);

		// check to make sure the primary category entered from command line is actually one of the categories
		if (categories.indexOf(primaryCategory) === -1) {
			winston.error('Given class does not exist: ' + primaryCategory);
			return;
		}

		// initialize data sets
		trainingSet = dataSet.slice(0,dataSet.length/2);
		testingSet = dataSet.slice(dataSet.length/2, dataSet.length);

		// get the data for the primary category and for the secondary category
		primaryCategoryData = getAllDataForCategory(trainingSet, primaryCategory);
		
		otherCategoryData = [];
		categories.forEach(function(category) {
			if (category !== primaryCategory) {
				otherCategoryData = otherCategoryData.concat(getAllDataForCategory(trainingSet, category));
			}
		});
	} while(primaryCategoryData.length === 0 || otherCategoryData.length === 0);

	// initialize classifier
	var classifier = bayes();

	// teach the classifier about the data
	classifier.teachPrimaryCategory(primaryCategoryData);
	classifier.teachSecondaryCategory(otherCategoryData);

	if (bayesType === 'naive')
		classifier.naivify();

	var numCorrect = 0;
	var numWrong = 0;
	var percentCorrect = 0;

	testingSet.forEach(function(dataPoint) {
		var c = classifier.classify(dataPoint);

		if (c > 0) {
			if (dataPoint.category === primaryCategory) numCorrect++;
			else numWrong++;
		}
		else {
			if (dataPoint.category !== primaryCategory) numCorrect++;
			else numWrong++;
		}
	});

	percentCorrect = numCorrect/testingSet.length*100;

	return {
		numCorrect: numCorrect,
		numWrong: numWrong,
		percentCorrect: percentCorrect
	};
};

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
			var vector = [];

			for (var item in data) {
				if (item !== 'category')
					vector.push(Number(data[item]));
			}

			dataForCategory.push(vector);
		}
	});

	return dataForCategory;
};

module.exports.runClassifier = runClassifier;
module.exports.shuffle = shuffle;
module.exports.getCategories = getCategories;
module.exports.getAllDataForCategory = getAllDataForCategory;