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