(function(obj) {
  // The book
  var book = null;
  var currentPage = null;

  // Setup zip
  obj.zip.workerScriptsPath = "lib/zip.js/WebContent/";


  // File picker
  var eltFilePicker = document.getElementById("pick_file");
  var eltFilePickerUL = document.getElementById("pick_file_ul");
  var eltPages = document.getElementById("pages");
  var eltPrefetch1 = document.getElementById("prefetch_1");
  var eltPrefetch2 = document.getElementById("prefetch_2");

  eltFilePickerUL.addEventListener("click", function oncommand(e) {
    eltFilePicker.click();
  });

  eltFilePicker.addEventListener("click", function oncommand(e) {
    e.stopPropagation();
  });

  eltFilePicker.addEventListener("change", function oncommand(e) {
    if (!eltFilePicker.files || !eltFilePicker.files.length) {
      return;
    }
    var files = [];
    var i;
    for (i = 0; i < eltFilePicker.files.length; ++i) {
      files.push(eltFilePicker.files[i]);
    }
    book = new obj.Book(files);
    displayPage(eltPages, currentPage = 0);
  });

  var displayPage = function displayDelta(elt, page) {
    if (!book) {
      return;
    }
    book.displayPage(elt, page).then(
      function onSuccess() {
        console.log("Display success");
      },
      function onError(e) {
        eltPages.innerHTML = "";
        eltPages.textContent = "Display error";
        console.log("Display error", e);
        console.dir(e);
      }
    );
  };

  var onkey = function onkey(event) {
    console.log("keypress", event);
    if (!book) {
      return;
    }
    var code;
    if ("keyCode" in event || "which" in event) {
      code = event.keyCode || event.which;
      if (
        code == KeyEvent.DOM_VK_DOWN
          || code == KeyEvent.DOM_VK_PAGE_DOWN
          || code == KeyEvent.DOM_VK_RIGHT
          || code == KeyEvent.DOM_VK_SPACE
         ) {
        ++currentPage;
      } else if (
        code == KeyEvent.DOM_VK_UP
          || code == KeyEvent.DOM_VK_PAGE_UP
          || code == KeyEvent.DOM_VK_LEFT
          || code == KeyEvent.DOM_VK_BACK_SPACE
      ) {
        --currentPage;
      } else {
        return;
      }
      displayPage(eltPages, currentPage);
    }
  };

  document.addEventListener("keypress", onkey);
})(this);