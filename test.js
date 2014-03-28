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
		partitions[categoryToCompare].meanVector =  builMeanVector(partitions[categoryToCompare].data);
		partitions[categoryToCompare].covarianceMatrix = buildCovarianceMatrix(partitions[categoryToCompare], k);

		// Assemble other partition
		partitions.other = { data: [], meanVector: {} };
		categories.forEach(function(category) {
			if (category !== categoryToCompare) {
				partitions.other.data = partitions.other.data.concat(getAllDataForCategory(trainingSet, category));
			}
		});
		partitions.other.meanVector =  builMeanVector(partitions.other.data);
		partitions.other.covarianceMatrix = buildCovarianceMatrix(partitions.other, k);

		var c = classify(partitions[categoryToCompare], partitions.other, testingSet[0]);

		if (c > 0) winston.info("This belongs to " + categoryToCompare + "!");
		else winston.info("This does NOT belong to " + categoryToCompare + "!");
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
				vector.push(Number(data[item]));
			}

			dataForCategory.push(vector);
		}
	});

	return dataForCategory;
};

var builMeanVector = function(dataSet) {
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

var buildCovarianceMatrix = function(partition, k) {
	var covarianceMatrix = math.zeros(k,k);

	// create sum matrix
	partition.data.forEach(function(dataPoint) {
		var subtractedMean = math.eval('[dataPoint - meanVector]', { dataPoint: dataPoint, meanVector: partition.meanVector });
		var transpose = math.transpose(subtractedMean);
		var matrix = math.multiply(transpose, subtractedMean);
		covarianceMatrix = math.add(covarianceMatrix, matrix);
	});

	// divide by n-1
	covarianceMatrix = covarianceMatrix.map(function (value, index, matrix) {
		return math.divide(value, partition.data.length - 1);
	});

	return covarianceMatrix;
};

var classify = function(A, B, dataPoint) {
	var c = 0;
	var dataPointVector = [];

	for (var key in dataPoint) {
		if (key !== 'category') {
			dataPointVector.push(Number(dataPoint[key]));
		}
	}

	// ln(det(covA)) - ln(det(covB)) + transpose((dataPoint-meanB)

	var firstPart = math.log(math.det(A.covarianceMatrix), math.E);
	var secondPart = math.log(math.det(B.covarianceMatrix), math.E);
	
	var firstPartOfThirdPart = math.eval("[vector]", { vector: math.subtract(dataPointVector, B.meanVector) });
	var secondPartOfThirdPart = math.inv(B.covarianceMatrix);
	var thirdPartOfThirdPart = math.eval("[vector]'", { vector: math.subtract(dataPointVector, B.meanVector) });
	var thirdPart = math.multiply(math.multiply(firstPartOfThirdPart, secondPartOfThirdPart), thirdPartOfThirdPart);

	var firstPartOfFourthPart = math.eval("[vector]", { vector: math.subtract(dataPointVector, A.meanVector) });
	var secondPartOfFourthPart = math.inv(A.covarianceMatrix);
	var thirdPartOfFourthPart = math.eval("[vector]'", { vector: math.subtract(dataPointVector, A.meanVector) });
	var fourthPart = math.multiply(math.multiply(firstPartOfFourthPart, secondPartOfFourthPart), thirdPartOfFourthPart);

	// final calculation, finally
	c = math.eval("firstPart - secondPart + thirdPart - fourthPart", { firstPart: firstPart, secondPart: secondPart, thirdPart: thirdPart, fourthPart: fourthPart });

	return c;
};