var app = angular.module('myApp', ['ngImpress']);

app.controller('MyController', function ($scope, $interval, ImpressStep, impress, $timeout) {

  var self = this;

  this.impress = impress('myImpress');
  this.steps = [];
  
  this.addStep = function () {
    
    var step = new ImpressStep({
      caption: 'Step ' + (self.addStep.count = (self.addStep.count||0) + 1),
      translate: {
        x: self.steps.length ? self.steps[self.steps.length-1].translate.x + 910 : 0
      }
    });

    self.steps.push(step);

    // We can select the step after the angular digest has run.
    // this.steps -> ng-repeat -> impress-view directive -> impress api
  
    $timeout(function() {
      self.impress.goto(step);
    });
  };

  this.removeStep = function(step) {
    var idx = self.steps.indexOf(step);
    self.steps.splice(idx, 1);
  };

  this.randomize = function (step) {
    step.rotate.x += -10.0 + Math.random() * 20.0;
    step.rotate.y += -10.0 + Math.random() * 20.0;
    step.rotate.z += -10.0 + Math.random() * 20.0;

    step.translate.x += -10.0 + Math.random() * 20.0;
    step.translate.y += -10.0 + Math.random() * 20.0;
    step.translate.z += -10.0 + Math.random() * 20.0;

    step.scale += -0.5 + Math.random() * 1.0;
    step.scale = Math.max(0.1, step.scale);
  };

  this.randomizeAll = function() {
    self.steps.forEach(function(x) {
      self.randomize(x);
    });
  };

  this.removeAll = function() {
    self.steps.length = 0;
  };

  this.addStep();  
});