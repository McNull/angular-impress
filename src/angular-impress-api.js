/**
 * impress.js
 *
 * impress.js is a presentation tool based on the power of CSS3 transforms and transitions
 * in modern browsers and inspired by the idea behind prezi.com.
 *
 *
 * Copyright 2011-2012 Bartek Szopka (@bartaz)
 *
 * Released under the MIT and GPL Licenses.
 *
 * ------------------------------------------------
 *  author:  Bartek Szopka
 *  version: 0.5.3
 *  url:     http://bartaz.github.com/impress.js/
 *  source:  http://github.com/bartaz/impress.js/
 */
/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, latedef:true, newcap:true,
         noarg:true, noempty:true, undef:true, strict:true, browser:true */
// You are one of those who like to know how things work inside?
// Let me show you the cogs that make impress.js run...
(function (document, window, angular) {
  "use strict";
  //////////////////////////////////////////////////////////////////////////
  // HELPER FUNCTIONS


  // GLOBALS AND DEFAULTS
  // This is where the root elements of all impress.js instances will be kept.
  // Yes, this means you can have more than one instance on a page, but I'm not
  // sure if it makes any sense in practice ;)
  var roots = {};
  // Some default config values.
  var defaults = {
    width: 1024,
    height: 768,
    maxScale: 1,
    minScale: 0,
    perspective: 1000,
    transitionDuration: 1000
  };
  // It's just an empty function ... and a useless comment.
  var empty = function () {
    return false;
  }
    ;
  ////////////////////////////////////////////////////////////////////////////////////
  // IMPRESS.JS API
  var ngImpressApi = angular.module('ngImpress.api', ['ngImpress.utils']);

  ngImpressApi.run(function ($document, ngImpressUtils) {
    // First we set up the viewport for mobile devices.
    // For some reason iPad goes nuts when it is not done properly.
    var meta = ngImpressUtils.$("meta[name='viewport']") || $document[0].createElement("meta");
    meta.content = "width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no";
    if (meta.parentNode !== $document[0].head) {
      meta.name = "viewport";
      $document[0].head.appendChild(meta);
    }
  });

  ngImpressApi.factory('impress', function ($timeout, ngImpressUtils, $document) {

    var toNumber = ngImpressUtils.toNumber;
    var throttle = ngImpressUtils.throttle;
    var impressSupported = ngImpressUtils.impressSupported;
    var css = ngImpressUtils.css;
    var byId = ngImpressUtils.byId;
    var $ = ngImpressUtils.$;
    var computeWindowScale = ngImpressUtils.computeWindowScale;
    var perspective = ngImpressUtils.perspective;
    var scale = ngImpressUtils.scale;
    var triggerEvent = ngImpressUtils.triggerEvent;
    var rotate = ngImpressUtils.rotate;
    var translate = ngImpressUtils.translate;

    // var body = $document[0].body;
    // var pfx = ngImpressUtils.pfx;

    // And that's where interesting things will start to happen.
    // It's the core `impress` function that returns the impress.js API
    // for a presentation based on the element with given id ('impress'
    // by default).
    var impress = window.impress = function (rootId) {
      // If impress.js is not supported by the browser return a dummy API
      // it may not be a perfect solution but we return early and avoid
      // running code that may use features not implemented in the browser.
      if (!impressSupported) {
        return {
          init: empty,
          goto: empty,
          prev: empty,
          next: empty
        };
      }
      rootId = rootId || "impress";
      // If given root is already initialized just return the API
      if (roots["impress-root-" + rootId]) {
        return roots["impress-root-" + rootId];
      }
      
      var _steps = [];
      var activeStep = null;
      // // Array of step elements
      // var steps = [];
      // // Data of all presentation steps
      // var stepsData = {};
      // // Element of currently active step
      // var activeStep = null;

      // Current state (position, rotation and scale) of the presentation
      var currentState = null;
      // Configuration options
      var config = null;
      // Scale factor of the browser window
      var windowScale = null;
      // Root presentation elements
      var container = byId(rootId);
      var root = container.children[0];
      var canvas = root.children[0];
      
      var initialized = false;
      // STEP EVENTS
      //
      // There are currently two step events triggered by impress.js
      // `impress:stepenter` is triggered when the step is shown on the
      // screen (the transition from the previous one is finished) and
      // `impress:stepleave` is triggered when the step is left (the
      // transition to next step just starts).
      // Reference to last entered step
      var lastEntered = null;
      // `onStepEnter` is called whenever the step element is entered
      // but the event is triggered only if the step is different than
      // last entered step.
      var onStepEnter = function (step) {
        if (lastEntered !== step) {
          triggerEvent(step.el, "impress:stepenter");
          lastEntered = step;
        }
      };

      // `onStepLeave` is called whenever the step element is left
      // but the event is triggered only if the step is the same as
      // last entered step.
      var onStepLeave = function (step) {
        if (lastEntered === step) {
          triggerEvent(step.el, "impress:stepleave");
          lastEntered = null;
        }
      };

      var addStep = function (step) {
        _steps.push(step);
        // steps.push(step.el);
        // stepsData["impress-" + step.el.id] = step;
        if (_steps.length === 1) {
          goto(0);
        }
      };

      var updateStep = function (step) {
        
        css(step.el, {
          position: "absolute",
          transform: "translate(-50%,-50%)" + translate(step.translate) + rotate(step.rotate) + scale(step.scale),
          transformStyle: "preserve-3d"
        });

        if (activeStep === step) {
          throttle(function () {
            goto(step);
          }, 100)();
        }
      };

      // `init` API function that initializes (and runs) the presentation.
      var init = function () {
        if (initialized) {
          return;
        }
        // Initialize configuration object
        var rootData = root.dataset;
        config = {
          width: toNumber(rootData.width, defaults.width),
          height: toNumber(rootData.height, defaults.height),
          maxScale: toNumber(rootData.maxScale, defaults.maxScale),
          minScale: toNumber(rootData.minScale, defaults.minScale),
          perspective: toNumber(rootData.perspective, defaults.perspective),
          transitionDuration: toNumber(rootData.transitionDuration, defaults.transitionDuration)
        };
        windowScale = computeWindowScale(config);

        // document.documentElement.style.height = "100%";
        css(container, {
          // height: "100%",
          overflow: "hidden"
        });
        var rootStyles = {
          position: "absolute",
          transformOrigin: "top left",
          transition: "all 0s ease-in-out",
          transformStyle: "preserve-3d"
        };
        css(root, rootStyles);
        css(root, {
          top: "50%",
          left: "50%",
          transform: perspective(config.perspective / windowScale) + scale(windowScale)
        });
        css(canvas, rootStyles);
        
        container.classList.remove("impress-disabled");
        container.classList.add("impress-enabled");
        
        currentState = {
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
          scale: 1
        };

        initialized = true;
        triggerEvent(root, "impress:init", {
          api: roots["impress-root-" + rootId]
        });
        
      }
        ;
      // `getStep` is a helper function that returns a step element defined by parameter.
      // If a number is given, step with index given by the number is returned, if a string
      // is given step element with such id is returned, if DOM element is given it is returned
      // if it is a correct step element.
      var getStep = function (idOrIdxOrDOM) {
        var step;
        if (typeof idOrIdxOrDOM === "number") {
          step = idOrIdxOrDOM < 0 ? _steps[steps.length + idOrIdxOrDOM] : _steps[idOrIdxOrDOM];
        } else if (typeof idOrIdxOrDOM === "string") {
          step = _steps.find(function(s) { 
            return s.el.id === idOrIdxOrDOM;
          });
        } else if(idOrIdxOrDOM instanceof HTMLElement) {
          step = _steps.find(function(x) { return idOrIdxOrDOM === x.el; })
        } else {
          step = _steps.indexOf(idOrIdxOrDOM) !== -1 ? idOrIdxOrDOM : null;
        }
        return step;
      };

      // Used to reset timeout for `impress:stepenter` event
      var stepEnterTimeout = null;
      // `goto` API function that moves to step given with `el` parameter
      // (by index, id or element), with a transition `duration` optionally
      // given as second parameter.
      var goto = function (stepOrIdOrIdx, duration) {

        var step;

        if (!initialized || !(step = getStep(stepOrIdOrIdx))) {
          // Presentation not initialized or given element is not a step
          return false;
        }

        
        
        // Sometimes it's possible to trigger focus on first link with some keyboard action.
        // Browser in such a case tries to scroll the page to make this element visible
        // (even that body overflow is set to hidden) and it breaks our careful positioning.
        //
        // So, as a lousy (and lazy) workaround we will make the page scroll back to the top
        // whenever slide is selected
        //
        // If you are reading this and know any better way to handle it, I'll be glad to hear
        // about it!
        window.scrollTo(0, 0);
        
        if (activeStep) {
          activeStep.el.classList.remove("active");
          container.classList.remove("impress-on-" + activeStep.el.id);
        }
        step.el.classList.add("active");
        container.classList.add("impress-on-" + step.el.id);
        // Compute target state of the canvas based on given step
        var target = {
          rotate: {
            x: -step.rotate.x,
            y: -step.rotate.y,
            z: -step.rotate.z
          },
          translate: {
            x: -step.translate.x,
            y: -step.translate.y,
            z: -step.translate.z
          },
          scale: 1 / step.scale
        };
        // Check if the transition is zooming in or not.
        //
        // This information is used to alter the transition style:
        // when we are zooming in - we start with move and rotate transition
        // and the scaling is delayed, but when we are zooming out we start
        // with scaling down and move and rotation are delayed.
        var zoomin = target.scale >= currentState.scale;
        duration = toNumber(duration, config.transitionDuration);
        var delay = (duration / 2);
        // If the same step is re-selected, force computing window scaling,
        // because it is likely to be caused by window resize
        if (step === activeStep) {
          windowScale = computeWindowScale(config);
        }
        var targetScale = target.scale * windowScale;
        // Trigger leave of currently active element (if it's not the same step again)
        if (activeStep && activeStep !== step) {
          onStepLeave(activeStep);
        }
        // Now we alter transforms of `root` and `canvas` to trigger transitions.
        //
        // And here is why there are two elements: `root` and `canvas` - they are
        // being animated separately:
        // `root` is used for scaling and `canvas` for translate and rotations.
        // Transitions on them are triggered with different delays (to make
        // visually nice and 'natural' looking transitions), so we need to know
        // that both of them are finished.
        css(root, {
          // To keep the perspective look similar for different scales
          // we need to 'scale' the perspective, too
          transform: perspective(config.perspective / targetScale) + scale(targetScale),
          transitionDuration: duration + "ms",
          transitionDelay: (zoomin ? delay : 0) + "ms"
        });
        css(canvas, {
          transform: rotate(target.rotate, true) + translate(target.translate),
          transitionDuration: duration + "ms",
          transitionDelay: (zoomin ? 0 : delay) + "ms"
        });
        // Here is a tricky part...
        //
        // If there is no change in scale or no change in rotation and translation, it means
        // there was actually no delay - because there was no transition on `root` or `canvas`
        // elements. We want to trigger `impress:stepenter` event in the correct moment, so
        // here we compare the current and target values to check if delay should be taken into
        // account.
        //
        // I know that this `if` statement looks scary, but it's pretty simple when you know
        // what is going on
        // - it's simply comparing all the values.
        if (currentState.scale === target.scale || (currentState.rotate.x === target.rotate.x && currentState.rotate.y === target.rotate.y && currentState.rotate.z === target.rotate.z && currentState.translate.x === target.translate.x && currentState.translate.y === target.translate.y && currentState.translate.z === target.translate.z)) {
          delay = 0;
        }
        // Store current state
        currentState = target;
        activeStep = step;
        // And here is where we trigger `impress:stepenter` event.
        // We simply set up a timeout to fire it taking transition duration
        // (and possible delay) into account.
        //
        // I really wanted to make it in more elegant way. The `transitionend` event seemed to
        // be the best way to do it, but the fact that I'm using transitions on two separate
        // elements and that the `transitionend` event is only triggered when there was a
        // transition (change in the values) caused some bugs and made the code really
        // complicated, cause I had to handle all the conditions separately. And it still
        // needed a `setTimeout` fallback for the situations when there is no transition at
        // all.
        // So I decided that I'd rather make the code simpler than use shiny new
        // `transitionend`.
        //
        // If you want learn something interesting and see how it was done with `transitionend`
        // go back to
        // version 0.5.2 of impress.js:
        // http://github.com/bartaz/impress.js/blob/0.5.2/js/impress.js
        window.clearTimeout(stepEnterTimeout);
        stepEnterTimeout = window.setTimeout(function () {
          onStepEnter(activeStep);
        }, duration + delay);
        return step;
      }
        ;
      // `prev` API function goes to previous step (in document order)
      var prev = function () {
        var prev = _steps.indexOf(activeStep) - 1;
        prev = prev >= 0 ? _steps[prev] : _steps[_steps.length - 1];
        return goto(prev);
      }
        ;
      // `next` API function goes to next step (in document order)
      var next = function () {
        var next = _steps.indexOf(activeStep) + 1;
        next = next < _steps.length ? _steps[next] : _steps[0];
        return goto(next);
      }
        ;
      // Adding some useful classes to step elements.
      //
      // All the steps that have not been shown yet are given `future` class.
      // When the step is entered the `future` class is removed and the `present`
      // class is given. When the step is left `present` class is replaced with
      // `past` class.
      //
      // So every step element is always in one of three possible states:
      // `future`, `present` and `past`.
      //
      // There classes can be used in CSS to style different types of steps.
      // For example the `present` class can be used to trigger some custom
      // animations when step is shown.
      root.addEventListener("impress:init", function () {
        //       // STEP CLASSES
        //       steps.forEach(function (step) {
        //         step.classList.add("future");
        //       });
        root.addEventListener("impress:stepenter", function (event) {
          event.target.classList.remove("past");
          event.target.classList.remove("future");
          event.target.classList.add("present");
        }, false);
        root.addEventListener("impress:stepleave", function (event) {
          event.target.classList.remove("present");
          event.target.classList.add("past");
        }, false);
      }, false);
      // // Adding hash change support.
      // root.addEventListener("impress:init", function () {
      //   // Last hash detected
      //   var lastHash = "";
      //   // `#/step-id` is used instead of `#step-id` to prevent default browser
      //   // scrolling to element in hash.
      //   //
      //   // And it has to be set after animation finishes, because in Chrome it
      //   // makes transtion laggy.
      //   // BUG: http://code.google.com/p/chromium/issues/detail?id=62820
      //   root.addEventListener("impress:stepenter", function (event) {
      //     window.location.hash = lastHash = "#/" + event.target.id;
      //   }, false);
      //   window.addEventListener("hashchange", function () {
      //     // When the step is entered hash in the location is updated
      //     // (just few lines above from here), so the hash change is
      //     // triggered and we would call `goto` again on the same element.
      //     //
      //     // To avoid this we store last entered hash and compare.
      //     if (window.location.hash !== lastHash) {
      //       goto(getElementFromHash());
      //     }
      //   }, false);
      //   //       START
      //   //       by selecting step defined in url or first step of the presentation
      //   //       goto(getElementFromHash() || steps[0], 0);
      // }, false);
      
      container.classList.add("impress-disabled");
      // Store and return API for given impress.js root element
      return (roots["impress-root-" + rootId] = {
        init: init,
        goto: goto,
        next: next,
        prev: prev,
        addStep: addStep,
        updateStep: updateStep,
        activeStep: function() { return activeStep; },
        steps: _steps
      });
    }
      ;
    // Flag that can be used in JS to check if browser have passed the support test
    impress.supported = impressSupported;
    return impress;
  });
})(document, window, angular);
// THAT'S ALL FOLKS!
//
// Thanks for reading it all.
// Or thanks for scrolling down and reading the last part.
//
// I've learnt a lot when building impress.js and I hope this code and comments
// will help somebody learn at least some part of it.
