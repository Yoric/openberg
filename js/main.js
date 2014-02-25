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
  var eltFilePickerButton = document.getElementById("pick_file_button");
  var eltFilePickerButtonWel = document.getElementById("pick_file_button_welcome");
  var eltMenuLink = document.getElementById("menu-buton");
  var eltMenu = document.getElementById("menu");
  var eltMenuFile = document.getElementById("fileName");
  var eltMenuPages = document.getElementById("filePages");
  var eltMenuActualPage = document.getElementById("actualPage");
  var eltPages = document.getElementById("pages");
  var eltFlip = document.getElementById("flipbook");
  var eltWelcome = document.getElementById("welcome");
  var eltLeft = document.getElementById("go_left");
  var eltRight = document.getElementById("go_right");

  /**
   * Local Storage Options
  */
  var readerOptions = {};
  // Get ComicReader general options using local Storage or load a new options set
  if ( typeof(Storage)!=="undefined" && localStorage.getItem( 'readerOptionsStored' ) ) {
      // Localstorage detected - Load setings
      readerOptions = JSON.parse( localStorage.getItem( 'readerOptionsStored' ) );
  } else {
      // No localstorage settings detected (first time or no local storage avaible) - Create new profile
      readerOptions = {
          'zoom': false,
          'fitwidth': true,
          'rememberpage': true
      };
      // Save in local storage if avaible
      if ( typeof(Storage)!=="undefined" ) {
          localStorage.setItem( 'readerOptionsStored', JSON.stringify( readerOptions ) );
      }
  }

  var flipBook = new obj.FlipBook(eltFlip, Options, readerOptions);

  /**
   * Handle events
   */

  /**
   * File picker
   */
  eltFilePickerButton.addEventListener("click", function oncommand(e) {
    eltFilePickerControl.click();
  });
  eltFilePickerButtonWel.addEventListener("click", function oncommand(e) {
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
    var savedPage = 0;
    for (i = 0; i < eltFilePickerControl.files.length; ++i) {
      files.push(eltFilePickerControl.files[i]);
    }
    flipBook.book = new obj.Book(files);
    flipBook.book.bookName = files[0].name.replace(/[\. ,:-]+/g, "_");

    // Check if last page is saved in localStorage
    if ( typeof(Storage)!=="undefined"  && flipBook.readerOptions.rememberpage && localStorage.getItem(flipBook.book.bookName + "_page")) {
      savedPage = parseInt(localStorage.getItem(flipBook.book.bookName + "_page"));
      flipBook.page = savedPage;
    }

    flipBook.page = savedPage;

    flipBook.display().then(
      function onSuccess() {
        // The page was displayed correctly, hide the welcome screen
        eltPages.style.display = null;
        eltWelcome.style.display = "none";
      }
    );
  });

  /**
   * Keyboard
   */
  var onkey = function onkey(event) {
    var code;
    var delta;
    var displayClass;
    if ("keyCode" in event || "which" in event) {
      code = event.keyCode || event.which;
      if (code == KeyEvent.DOM_VK_DOWN || code == KeyEvent.DOM_VK_PAGE_DOWN) {
        eltFlip.scrollTop += 30;
      } else if (code == KeyEvent.DOM_VK_UP || code == KeyEvent.DOM_VK_PAGE_UP) {
        eltFlip.scrollTop -= 30;
      } else if (code == KeyEvent.DOM_VK_RIGHT) {
        delta = Options.ltr?1:-1;
        displayClass = "left";
        movePage(delta, displayClass);
      } else if (code == KeyEvent.DOM_VK_LEFT) {
        delta = Options.ltr?-1:1;
        displayClass = "right";
        movePage(delta, displayClass);
      } else {
        return;
      }
    }
  };

  document.addEventListener("keypress", onkey);

  /**
  * Open / Cose Menu
  */
  var openmenu = function openmenu(){
    if (eltMenu.className == 'menu_open') {
      eltMenu.className = 'menu_close';
      eltMenuLink.className = 'menu_link_close';
    }else{
      eltMenu.className = 'menu_open';
      eltMenuLink.className = 'menu_link_open';
    }
    if(flipBook.book){
      eltMenuFile.textContent = flipBook.book.bookName;
      eltMenuPages.textContent = flipBook.book.totalPages -1;
      eltMenuActualPage.textContent = flipBook.page;
    }
  }
  eltMenuLink.addEventListener("click", openmenu );

  /**
   * Mouse/touch
   */
  var movePage = function movePage(delta, displayClass) {
    if (flipBook.book == null) {
      return;
    }
    // if we try to pass the first or the last page
    if (flipBook.page + delta >= 0 && flipBook.page + delta < flipBook.book.totalPages) {

      flipBook.page += delta;
      flipBook.displayClass = displayClass;
      flipBook.display().then(
        function onSuccess() {
          // Back into the book
          eltPages.style.display = null;
          eltWelcome.style.display = "none";
        },
        function onFailure(e) {
          if (!(e instanceof obj.Book.NoSuchPageError)) {
            console.error("Cannot handle error", e);
          }
          // We have left the book
          eltPages.style.display = "none";
          eltFlip.className = "";
          eltWelcome.style.display = null;
        }
      );
    } else {
      console.log("End of the book");
      openmenu();
    }


  };

  /**
   * Option inputs
   */
  $( 'input[type=radio]' ).each( function() {
      var option = $(this).attr("name"),
          value = $(this).val();

      if (flipBook.readerOptions[option] && value == 1) {
          $(this).prop("checked", true );
      } else if ( !flipBook.readerOptions[option] && value == 0 ) {
          $(this).prop("checked", true );
      }

  } );
  $("input[type=radio]").change(function() {
      var option = $(this).attr("name"),
          value = $(this).val();

      flipBook.readerOptions[option] = (value == 1) ? true : false;

      // Save value in local storage
      if (typeof(Storage)!=="undefined") {
          localStorage.setItem('readerOptionsStored', JSON.stringify(flipBook.readerOptions));
      }
  } );

  // Debugging code
  var oncontrol = function oncontrol(e) {
    var delta;
    if (e.target == eltRight) {
      delta = Options.ltr?1:-1;
      e.stopPropagation();
      movePage(delta,"left");
    } else if (e.target == eltLeft) {
      delta = Options.ltr?-1:1;
      e.stopPropagation();
      movePage(delta, "right");
    }
  };
  // Touchable events
  var $toTheNext = $(eltRight).Touchable();
  var $toThePrev = $(eltLeft).Touchable();
  // Click / swipe to next page
  $toTheNext.on('touchableend', oncontrol );
  // Click / swipe to prev page
  $toThePrev.on('touchableend', oncontrol );

  window.OpenBerg = {
    flipBook: flipBook,
    options: Options
  };
})(this);