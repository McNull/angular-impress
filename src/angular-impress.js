(function (angular) {
  var ngImpress = angular.module('ngImpress', ['ngImpress.api', 'ngImpress.utils']);
  ///////////////////////////////////////////////////
  ngImpress.directive('impress', function (impress) {
    var idCounter = 1;
    return {
      scope: true,
      restrict: 'AE',
      controller: angular.noop,
      link: {
        pre: function preLink($scope, $element, $attrs) {
          var id = $element[0].id;
          if (!id) {
            id = $element[0].id = 'ngImpress' + idCounter++;
          }
          var instance = impress(id);
          $element.data('impress', instance);
          instance.init();
          $scope.$impress = instance;
        },
        post: function ($scope, $element, $attrs) { }
      },
      transclude: true,
      template: '<div ng-transclude></div>'
    };
  });
  ///////////////////////////////////////////////////
  ngImpress.directive('impressStep', function (ngImpressUtils, ImpressStep) {
    var idCounter = 1;
    var toNumber = ngImpressUtils.toNumber;
    return {
      scope: {
        step: '=?step'
      },
      restrict: 'AE',
      controller: angular.noop,
      require: '^impress',
      link: function ($scope, $element, $attrs) {
        $element.addClass('step future');
        var impress = $scope.$impress = $element.inheritedData('impress');
        var id = $element[0].id;
        if (!id) {
          id = $element[0].id = 'ngImpressView' + idCounter++;
        }
        var step = $scope.step = $scope.step || ImpressStep.fromElement($element[0]);
        step.el = $element[0];
        impress.addStep(step);
        $scope.$watchGroup(['step.translate.x', 'step.translate.y', 'step.translate.z', 'step.rotate.x', 'step.rotate.y', 'step.rotate.z', 'step.scale'], function () {
          impress.updateStep(step);
        });

        $scope.$watch('step.order', function(x,y) {
          if(x!==y) {
            console.log(arguments);
            impress.sortSteps();
          }
        });
      }
    };
  });
  ///////////////////////////////////////////////////
  ngImpress.factory('ImpressStep', function (ngImpressUtils) {
    var toNumber = ngImpressUtils.toNumber;
    function ImpressStep(transform) {
      angular.merge(this, ImpressStep.defaults, transform || {});
    }
    ImpressStep.defaults = {
      translate: {
        x: 0,
        y: 0,
        z: 0
      },
      rotate: {
        x: 0,
        y: 0,
        z: 0
      },
      scale: 1,
      order: 0,
      el: null // DOM element
    };
    ImpressStep.fromElement = function (el) {
      var data = el.dataset;
      return new ImpressStep({
        translate: {
          x: toNumber(data.x),
          y: toNumber(data.y),
          z: toNumber(data.z)
        },
        rotate: {
          x: toNumber(data.rotateX),
          y: toNumber(data.rotateY),
          z: toNumber(data.rotateZ || data.rotate)
        },
        el: el
      });
    };
    return ImpressStep;
  });
  ///////////////////////////////////////////////////
})(angular);
