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
