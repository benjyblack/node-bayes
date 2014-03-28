/*jslint node: true */
'use strict';

var	mathjs = require('mathjs'),
	math = mathjs(),
	winston = require('winston');

module.exports = function() {
	return new Bayes();
};

function Bayes () {
	this.categories = {};
}

Bayes.prototype.teachPrimaryCategory = function(data) {
	this.teach(data, 'A');
};

Bayes.prototype.teachSecondaryCategory = function(data) {
	this.teach(data, 'B');
};

Bayes.prototype.teach = function(data, category) {
	this.categories[category] = { data: [], meanVector: [], covarianceMatrix: [] };
	this.categories[category].data = data;
	this.categories[category].meanVector =  this.buildMeanVector(category);
	this.categories[category].covarianceMatrix = this.buildCovarianceMatrix(category);
};

Bayes.prototype.buildMeanVector = function(category) {
	var vector = [];
	var dataSet = this.categories[category].data;

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

Bayes.prototype.buildCovarianceMatrix = function(category) {
	var categoryObject = this.categories[category];

	var k = Object.keys(categoryObject.data[0]).length;
	var covarianceMatrix = math.zeros(k,k);

	// create sum matrix
	categoryObject.data.forEach(function(dataPoint) {
		var subtractedMean = math.eval('[dataPoint - meanVector]', { dataPoint: dataPoint, meanVector: categoryObject.meanVector });
		var transpose = math.transpose(subtractedMean);
		var matrix = math.multiply(transpose, subtractedMean);
		covarianceMatrix = math.add(covarianceMatrix, matrix);
	});

	// divide by n-1
	covarianceMatrix = covarianceMatrix.map(function (value) {
		return math.divide(value, categoryObject.data.length - 1);
	});

	return covarianceMatrix;
};

Bayes.prototype.classify = function(dataPoint) {
	var A = this.categories.A;
	var B = this.categories.B;

	if (typeof(A) === 'undefined' || typeof(B) === 'undefined') {
		winston.error('Both PRIMARY and SECONDARY categories must be taught before classifying');
	}

	var c = 0;
	var dataPointVector = [];

	for (var key in dataPoint) {
		if (key !== 'category') {
			dataPointVector.push(Number(dataPoint[key]));
		}
	}

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

	c = c._data[0][0];

	return c;
};

Bayes.prototype.naivify = function() {
	var A = this.categories.A;
	var B = this.categories.B;

	if (typeof(A) === 'undefined' || typeof(B) === 'undefined') {
		winston.error('Both PRIMARY and SECONDARY categories must be taught before naivifying');
	}

	var cats = [A,B];

	cats.forEach(function(category) {
		var size = category.covarianceMatrix.size()[0];

		for (var i=0;i<size;i++) {
			for(var j=0;j<size;j++) {
				if (i === j) continue;
				else category.covarianceMatrix._data[i][j] = 0;
			}
		}
	});
}