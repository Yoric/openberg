(function(obj) {
  "use strict";

  // Options
  var Options = {
    ltr: true,
    bufferForwardsSize: 3,
    bufferBackwardsSize: 1
  };

  // Setup zip
  obj.zip.workerScriptsPath = "lib/zip.js/WebContent/";

  // Utilities
  var console = window.console;
  var requestAnimationFrame =
    window.requestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.ieRequestAnimationFrame
  || window.oRequestAnimationFrame
  || function emulatedRequestAnimationFrame(step) {
    window.setTimeout(step, 25);
  };
  var Promise = window["promise/core"];
  Promise.withLog = function(promise) {
    return promise.then(null,
      function onError(e) {
        console.error("Uncaught promise error", e);
        throw e;
      }
    );
  };

  // Elements
  var eltFilePickerControl = document.getElementById("pick_file_control");
  var eltFilePickerTab = document.getElementById("pick_file_tab");
  var eltPages = document.getElementById("pages");
  var eltWelcome = document.getElementById("welcome");


  var flipBook = new obj.FlipBook(eltPages, Options);

  // User Interface
  eltFilePickerTab.addEventListener("click", function oncommand(e) {
    eltFilePickerControl.click();
  });

  eltFilePickerControl.addEventListener("click", function oncommand(e) {
    e.stopPropagation();
  });

  eltFilePickerControl.addEventListener("change", function oncommand(e) {
    if (!eltFilePickerControl.files || !eltFilePickerControl.files.length) {
      return;
    }
    var files = [];
    var i;
    for (i = 0; i < eltFilePickerControl.files.length; ++i) {
      files.push(eltFilePickerControl.files[i]);
    }
    flipBook.book = new obj.Book(files);
    flipBook.page = 0;
    flipBook.display().then(
      function onSuccess() {
        // The page was displayed correctly, hide the welcome screen
        eltWelcome.style.display = "none";
      }
    );
  });

  var onkey = function onkey(event) {
    var code;
    var delta;
    if ("keyCode" in event || "which" in event) {
      code = event.keyCode || event.which;
      if ( // FIXME: Chrome doesn't define KeyEvent
        code == KeyEvent.DOM_VK_DOWN
          || code == KeyEvent.DOM_VK_PAGE_DOWN
          || code == KeyEvent.DOM_VK_SPACE
         ) {
           delta = 1;
      } else if (
        code == KeyEvent.DOM_VK_UP
          || code == KeyEvent.DOM_VK_PAGE_UP
          || code == KeyEvent.DOM_VK_BACK_SPACE
      ) {
        delta = -1;
      } else if (code == KeyEvent.DOM_VK_RIGHT) {
        delta = Options.ltr?1:-1;
      } else if (code == KeyEvent.DOM_VK_LEFT) {
        delta = Options.ltr?-1:1;
      } else {
        return;
      }
      // FIXME: If we are on the display screen, we can
      // use the keyboard to return to the book
      flipBook.page += delta;
      flipBook.display().then(
        null,
        function onFailure(e) {
          if (e instanceof obj.Book.NoSuchPageError) {
            // We have left the book
            eltPages.style.display = "none";
            eltWelcome.style.display = null;
          }
        }
      );
    }
  };

  document.addEventListener("keypress", onkey);


  // Debugging code

  window.OpenBerg = {
    flipBook: flipBook,
    options: Options
  };
})(this);