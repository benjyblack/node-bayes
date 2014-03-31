/*jslint node: true */
'use strict';

var organizeData = function(trainingSet, primaryCategory, categories) {
	var primaryCategoryData, secondaryCategoryData;

	// get the data for the primary category and for the secondary category
	primaryCategoryData = getAllDataForCategory(trainingSet, primaryCategory);

	secondaryCategoryData = [];
	categories.forEach(function(category) {
		if (category !== primaryCategory) {
			secondaryCategoryData = secondaryCategoryData.concat(getAllDataForCategory(trainingSet, category));
		}
	});

	return {
		primaryCategoryData: primaryCategoryData,
		secondaryCategoryData: secondaryCategoryData
	};
};

var partitionSets = function(dataSet, start, end) {
	var testingSet = dataSet.slice(start, end);
	var trainingSet = dataSet.diff(testingSet);

	return {
		trainingSet: trainingSet,
		testingSet: testingSet
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

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

module.exports.organizeData = organizeData;
module.exports.partitionSets = partitionSets;
module.exports.shuffle = shuffle;
module.exports.getCategories = getCategories;
module.exports.getAllDataForCategory = getAllDataForCategory;