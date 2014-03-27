'use strict';

module.exports = function(categories) {
	return new OptimalBayes(categories);
};

function OptimalBayes (dataset) {
	this.dataSet = dataset;
	this.trainingSet = [];
	this.testingSet = [];
}

OptimalBayes.prototype.partition = function() {
	var length = this.dataSet.length;

	this.trainingSet = this.dataSet.slice(0,length/2);
	this.testingSet = this.dataSet.slice(length/2, length);
};

OptimalBayes.prototype.partitionByClass = function() {

}