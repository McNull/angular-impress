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

      var removeStep = function(step) {
        var idx = _steps.indexOf(step);

        if(idx != -1) {
          if(activeStep === step) {
            prev();
          }
          _steps.splice(idx, 1);
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
        
        // window.scrollTo(0, 0);
        
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
        removeStep: removeStep,
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

(function(angular, document, window) {
  // NAVIGATION EVENTS
  // As you can see this part is separate from the impress.js core code.
  // It's because these navigation actions only need what impress.js provides with
  // its simple API.
  //
  // In future I think about moving it to make them optional, move to separate files
  // and treat more like a 'plugins'.
  "use strict";
  // Throttling function calls, by Remy Sharp
  // http://remysharp.com/2010/07/21/throttling-function-calls/
  var throttle = function(fn, delay) {
    var timer = null ;
    return function() {
      var context = this
        , args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(context, args);
      }, delay);
    }
    ;
  }
  ;
  // Wait for impress.js to be initialized
  document.addEventListener("impress:init", function(event) {
    // Getting API from event data.
    // So you don't event need to know what is the id of the root element
    // or anything. `impress:init` event data gives you everything you
    // need to control the presentation that was just initialized.
    var api = event.detail.api;
    // KEYBOARD NAVIGATION HANDLERS
    // Prevent default keydown action when one of supported key is pressed.
    document.addEventListener("keydown", function(event) {
      if (event.keyCode === 9 || (event.keyCode >= 32 && event.keyCode <= 34) || (event.keyCode >= 37 && event.keyCode <= 40)) {
        event.preventDefault();
      }
    }, false);
    // Trigger impress action (next or prev) on keyup.
    // Supported keys are:
    // [space] - quite common in presentation software to move forward
    // [up] [right] / [down] [left] - again common and natural addition,
    // [pgdown] / [pgup] - often triggered by remote controllers,
    // [tab] - this one is quite controversial, but the reason it ended up on
    //   this list is quite an interesting story... Remember that strange part
    //   in the impress.js code where window is scrolled to 0,0 on every presentation
    //   step, because sometimes browser scrolls viewport because of the focused element?
    //   Well, the [tab] key by default navigates around focusable elements, so clicking
    //   it very often caused scrolling to focused element and breaking impress.js
    //   positioning. I didn't want to just prevent this default action, so I used [tab]
    //   as another way to moving to next step... And yes, I know that for the sake of
    //   consistency I should add [shift+tab] as opposite action...
    document.addEventListener("keyup", function(event) {
      if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (event.keyCode === 9 || (event.keyCode >= 32 && event.keyCode <= 34) || (event.keyCode >= 37 && event.keyCode <= 40)) {
        switch (event.keyCode) {
        case 33:
          // Page up
        case 37:
          // Left
        case 38:
          // Up
          api.prev();
          break;
        case 9:
          // Tab
        case 32:
          // Space
        case 34:
          // Page down
        case 39:
          // Right
        case 40:
          // Down
          api.next();
          break;
        }
        event.preventDefault();
      }
    }, false);
//     // Delegated handler for clicking on the links to presentation steps
//     document.addEventListener("click", function(event) {
//       // Event delegation with "bubbling"
//       // Check if event target (or any of its parents is a link)
//       var target = event.target;
//       if (target) {
//         while ((target.tagName !== "A") && (target !== document.documentElement)) {
//           target = target.parentNode;
//         }
//         if (target.tagName === "A") {
//           var href = target.getAttribute("href");
//           // If it's a link to presentation step, target this step
//           if (href && href[0] === "#") {
//             target = document.getElementById(href.slice(1));
//           }
//         }
//         if (api.goto(target)) {
//           event.stopImmediatePropagation();
//           event.preventDefault();
//         }
//       }
//     }, false);
    // Delegated handler for clicking on step elements
//     document.addEventListener("click", function(event) {
//       var target = event.target;
//       // Find closest step element that is not active
//       while (!(target.classList.contains("step") && !target.classList.contains("active")) && (target !== document.documentElement)) {
//         target = target.parentNode;
//       }
//       if (api.goto(target)) {
//         event.preventDefault();
//       }
//     }, false);
    // Touch handler to detect taps on the left and right side of the screen
    // based on awesome work of @hakimel: https://github.com/hakimel/reveal.js
    document.addEventListener("touchstart", function(event) {
      if (event.touches.length === 1) {
        var x = event.touches[0].clientX
          , width = window.innerWidth * 0.3
          , result = null ;
        if (x < width) {
          result = api.prev();
        } else if (x > window.innerWidth - width) {
          result = api.next();
        }
        if (result) {
          event.preventDefault();
        }
      }
    }, false);
    // Rescale presentation when window is resized
    window.addEventListener("resize", throttle(function() {
      // Force going to active step again, to trigger rescaling
      api.goto(document.querySelector(".step.active"), 500);
    }, 250), false);
  }, false);
})(angular, document, window);

(function (angular, window, document) {
  'use strict';

  var ngImpressUtils = angular.module('ngImpress.utils', []);

  ngImpressUtils.factory('ngImpressUtils', function () {

    // `toNumber` takes a value given as `numeric` parameter and tries to turn
    // it into a number. If it is not possible it returns 0 (or other value
    // given as `fallback`).
    var toNumber = function (numeric, fallback) {
      return isNaN(numeric) ? (fallback || 0) : Number(numeric);
    };

    // Throttling function calls, by Remy Sharp
    // http://remysharp.com/2010/07/21/throttling-function-calls/
    var throttle = function (fn, delay) {
      var timer = null;
      return function () {
        var context = this
          , args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay);
      };
    };

    // `pfx` is a function that takes a standard CSS property name as a parameter
    // and returns it's prefixed version valid for current browser it runs in.
    // The code is heavily inspired by Modernizr http://www.modernizr.com/
    var pfx = (function () {
      var style = document.createElement("dummy").style
        , prefixes = "Webkit Moz O ms Khtml".split(" ")
        , memory = {};
      return function (prop) {
        if (typeof memory[prop] === "undefined") {
          var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1)
            , props = (prop + " " + prefixes.join(ucProp + " ") + ucProp).split(" ");
          memory[prop] = null;
          for (var i in props) {
            if (style[props[i]] !== undefined) {
              memory[prop] = props[i];
              break;
            }
          }
        }
        return memory[prop];
      };
    })();

    // `css` function applies the styles given in `props` object to the element
    // given as `el`. It runs all property names through `pfx` function to make
    // sure proper prefixed version of the property is used.
    var css = function (el, props) {
      var key, pkey;
      for (key in props) {
        if (props.hasOwnProperty(key)) {
          pkey = pfx(key);
          if (pkey !== null) {
            el.style[pkey] = props[key];
          }
        }
      }
      return el;
    };

    // `arraify` takes an array-like object and turns it into real Array
    // to make all the Array.prototype goodness available.
    var arrayify = function (a) {
      return [].slice.call(a);
    };

    // `byId` returns element with given `id` - you probably have guessed that ;)
    var byId = function (id) {
      return document.getElementById(id);
    };

    // `$` returns first element for given CSS `selector` in the `context` of
    // the given element or whole document.
    var $ = function (selector, context) {
      context = context || document;
      return context.querySelector(selector);
    };

    // `$$` return an array of elements for given CSS `selector` in the `context` of
    // the given element or whole document.
    var $$ = function (selector, context) {
      context = context || document;
      return arrayify(context.querySelectorAll(selector));
    };

    // `triggerEvent` builds a custom DOM event with given `eventName` and `detail` data
    // and triggers it on element given as `el`.
    var triggerEvent = function (el, eventName, detail) {
      var event = document.createEvent("CustomEvent");
      event.initCustomEvent(eventName, true, true, detail);
      el.dispatchEvent(event);
    };

    // `translate` builds a translate transform string for given data.
    var translate = function (t) {
      return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    };

    // `rotate` builds a rotate transform string for given data.
    // By default the rotations are in X Y Z order that can be reverted by passing `true`
    // as second parameter.
    var rotate = function (r, revert) {
      var rX = " rotateX(" + r.x + "deg) "
        , rY = " rotateY(" + r.y + "deg) "
        , rZ = " rotateZ(" + r.z + "deg) ";
      return revert ? rZ + rY + rX : rX + rY + rZ;
    };

    // `scale` builds a scale transform string for given data.
    var scale = function (s) {
      return " scale(" + s + ") ";
    };

    // `perspective` builds a perspective transform string for given data.
    var perspective = function (p) {
      return " perspective(" + p + "px) ";
    };

    // `getElementFromHash` returns an element located by id from hash part of
    // window location.
    var getElementFromHash = function () {
      // Get id from url # by removing `#` or `#/` from the beginning,
      // so both "fallback" `#slide-id` and "enhanced" `#/slide-id` will work
      return byId(window.location.hash.replace(/^#\/?/, ""));
    };

    // `computeWindowScale` counts the scale factor between window size and size
    // defined for the presentation in the config.
    var computeWindowScale = function (config) {
      var hScale = window.innerHeight / config.height
        , wScale = window.innerWidth / config.width
        , scale = hScale > wScale ? wScale : hScale;
      if (config.maxScale && scale > config.maxScale) {
        scale = config.maxScale;
      }
      if (config.minScale && scale < config.minScale) {
        scale = config.minScale;
      }
      return scale;
    };


    // CHECK SUPPORT
    var body = document.body;
    var ua = navigator.userAgent.toLowerCase();
    var impressSupported = // Browser should support CSS 3D transtorms
      (pfx("perspective") !== null) && // Browser should support `classList` and `dataset` APIs
      (body.classList) && (body.dataset); 
      // // But some mobile devices need to be blacklisted,
      // // because their CSS 3D support or hardware is not
      // // good enough to run impress.js properly, sorry...
      // (ua.search(/(iphone)|(ipod)|(android)/) === -1);
    if (!impressSupported) {
      // We can't be sure that `classList` is supported
      body.className += " impress-not-supported ";
    } else {
      body.classList.remove("impress-not-supported");
      body.classList.add("impress-supported");
    }

    return {
      toNumber: toNumber,
      throttle: throttle,
      pfx: pfx,
      css: css,
      arrayify: arrayify,
      byId: byId,
      $: $,
      $$: $$,
      triggerEvent: triggerEvent,
      translate: translate,
      rotate: rotate,
      scale: scale,
      perspective: perspective,
      getElementFromHash: getElementFromHash,
      computeWindowScale: computeWindowScale,
      impressSupported: impressSupported
    };

  });

})(angular, window, document);
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

          $element.addClass('impress');

          var id = $element[0].id;
          if (!id) {
            id = $element[0].id = 'ngImpress' + idCounter++;
          }

          var instance = impress(id);

          $element.data('impress', instance);

          instance.init();
          
        },
        post: function ($scope, $element, $attrs) { }
      },
      transclude: true,
      template: '<div class="impress-root"><div class="impress-canvas" ng-transclude></div></div>'
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

        $scope.$on('$destroy', function() {
          impress.removeStep(step);
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
        scale: toNumber(data.scale, 1),
        el: el
      });
    };
    return ImpressStep;
  });
  ///////////////////////////////////////////////////
})(angular);
