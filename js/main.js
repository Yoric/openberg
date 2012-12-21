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
  var eltFlip = document.getElementById("flipbook");
  var eltWelcome = document.getElementById("welcome");
  var eltLeft = document.getElementById("go_left");
  var eltRight = document.getElementById("go_right");

  eltPages.style.display = "none";

  var flipBook = new obj.FlipBook(eltFlip, Options);

  /**
   * Handle events
   */

  /**
   * File picker
   */
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
        eltPages.style.display = null;
      }
    );
  });

  /**
   * Keyboard
   */
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
      movePage(delta);
    }
  };

  document.addEventListener("keypress", onkey);

  /**
   * Mouse/touch
   */

  var movePage = function movePage(delta) {
    if (flipBook.book == null) {
      return;
    }
    flipBook.page += delta;
    flipBook.display().then(
      function onSuccess() {
        // Back into the book
        eltWelcome.style.display = "none";
        eltPages.style.display = null;
      },
      function onFailure(e) {
        if (!(e instanceof obj.Book.NoSuchPageError)) {
          console.error("Cannot handle error", e);
        }
        // We have left the book
        eltPages.style.display = "none";
        eltWelcome.style.display = null;
      }
    );
  };

  // Debugging code
  var oncontrol = function oncontrol(e) {
    var delta;
    if (e.target == eltRight) {
      delta = Options.ltr?1:-1;
      e.stopPropagation();
      movePage(delta);
    } else if (e.target == eltLeft) {
      delta = Options.ltr?-1:1;
      e.stopPropagation();
      movePage(delta);
    }
  };
  eltLeft.addEventListener("click", oncontrol);
  eltRight.addEventListener("click", oncontrol);
  eltLeft.addEventListener("touchup", oncontrol);
  eltRight.addEventListener("touchup", oncontrol);

  window.OpenBerg = {
    flipBook: flipBook,
    options: Options
  };
})(this);