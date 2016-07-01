var app = angular.module('myApp', ['ngImpress']);

app.controller('MyController', function ($scope, $interval, ImpressStep, impress, $timeout) {

  var self = this;

  this.impress = impress('myImpress');
  this.steps = [];

  
  this.addStep = function () {
    
    var step = new ImpressStep({
      caption: 'step ' + self.steps.length,
      translate: {
        x: self.steps.length * 910
      }
    });

    self.steps.push(step);

    $timeout(function() {
      self.impress.goto(step);
    });
  };

  this.addStep();

  // self.steps.sort((a, b) => b.order - a.order);
  // self.steps.forEach((x) => console.log(x.caption));

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

  // $interval(function() {
  //   self.steps[0].transform.rotate.y = self.steps[0].transform.rotate.z += 0.1;
  // }, 100);

});