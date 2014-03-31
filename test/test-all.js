/*jslint node: true */
'use strict';

var winston = require('winston'),
  csv = require('csv'),
  testFunctions = require('./test-functions'),
  bayes = require('../lib/bayes');

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

var bayesTypes = ['optimal', 'naive', 'linear'];

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
          // initialize classifier
          var classifier = bayes();

          var organizedData, sets;

          // repeat for as long as our categories are empty
          do {
            dataSet = testFunctions.shuffle(dataSet);
            sets = testFunctions.partitionSets(dataSet, 0, dataSet.length/2);

            // get all categories
            var categories = testFunctions.getCategories(dataSet);

            organizedData = testFunctions.organizeData(sets.trainingSet, primaryCategory, categories);
          } while(organizedData.primaryCategoryData.length === 0 || organizedData.secondaryCategoryData.length === 0);

          // teach the classifier about the data
          classifier.teachPrimaryCategory(organizedData.primaryCategoryData);
          classifier.teachSecondaryCategory(organizedData.secondaryCategoryData);

          if (bayesType === 'naive')
            classifier.naivify();

          var numCorrect = 0;
          var numWrong = 0;

          // Go through each data point in the testing set to see if our algorithm is correct
          sets.testingSet.forEach(function(dataPoint) {
            var c;

            if (bayesType === 'linear') c= classifier.classifyLinear(dataPoint);
            else c = classifier.classify(dataPoint);

            if (c > 0) {
              if (dataPoint.category === primaryCategory) numCorrect++;
              else numWrong++;
            }
            else {
              if (dataPoint.category !== primaryCategory) numCorrect++;
              else numWrong++;
            }
          });

          file.results[bayesType] += numCorrect/sets.testingSet.length*100;
        });
        winston.info('Algorithm: %s, Average percent: %d%', bayesType,file.results[bayesType]/file.categories.length);
      });

      winston.info('\n');
    })
    .on('error', function(error){
      winston.error('Error parsing CSV file: ' + error.message );
    });
});