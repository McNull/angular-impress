var app = angular.module('myApp', ['ngImpress']);

app.controller('MyController', function ($scope, $interval, ImpressStep) {

  var self = this;

  self.steps = [];

  var count = 5;

  while (count--) {
    self.steps.push(new ImpressStep({
      caption: 'step ' + count,
      text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deleniti explicabo reiciendis non quibusdam praesentium incidunt, voluptas pariatur sed officiis, tempore sint id ipsam molestias, earum voluptate blanditiis dolor, inventore sunt.',
      translate: {
        x: count * 910, y: 0, z: 0
      },
      rotate: {
        x: 0, y: 0, z: 0
      },
      scale: 1,
      order: 5 - count
    }));
  }

  this.rotate = function (step) {
    step.transform.rotate.x += 25;
    step.transform.rotate.y += 15;
    step.transform.rotate.z += 10;
  };

  // $interval(function() {
  //   self.steps[0].transform.rotate.y = self.steps[0].transform.rotate.z += 0.1;
  // }, 100);

});