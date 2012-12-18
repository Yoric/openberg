(function(obj) {
  "use strict";

  // Options
  var ltr = true;
  var buffer_forwards_size = 3;
  var buffer_backwards_size = 1;

  // Setup zip
  obj.zip.workerScriptsPath = "lib/zip.js/WebContent/";

  // The book
  var book = null;
  var currentPage = null;

  // Get rid of warnings
  var console = window.console;
  var Map = window.Map;
  var requestAnimationFrame =
    window.requestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.ieRequestAnimationFrame
  || window.oRequestAnimationFrame
  || function emulatedRequestAnimationFrame(step) {
    window.setTimeout(step, 25);
  };

  var Pages = {
    _map: new Map(),
    _bufferBefore: 1,
    _bufferAfter: 3,
    display: function display(pageNum) {
      var promise = this.fetch(pageNum);
      eltPages.classList.add("loading");
      return promise.then(
        function onSuccess(data) {
          if (pageNum != currentPage) {
            console.log("FIXME", "Do not display", pageNum, "we have moved away from that page");
          }
          eltPages.classList.remove("loading");
          if ("directory" in data) {
            eltPages.textContent = "Directory " + data.directory;
            return;
          }
          if ("imgURL" in data) {
            var date1 = Date.now();
            eltPages.innerHTML = "";
            var img = document.createElement("img");
            eltPages.appendChild(img);
            img.src = data.imgURL;
          }
        },
        function onError(e) {
          console.log("FIXME", "I should handle error", e, "for page", pageNum);
        });

    },
    fetch: function fetch(pageNum) {
      // Don't bother fetching the page if it is negative
      if (pageNum < 0) {
        return Promise.reject(Book.Error.NO_MORE_PAGES);
      }

      // Starting page prefetch
      var i;
      var pages = [];
      for (i = pageNum; i <= pageNum + this._bufferAfter; ++i) {
        pages.push(i);
      }
      for (i = Math.max(0, pageNum - 1); i >= pageNum - this._bufferBefore; --i) {
        pages.push(i);
      }
      var self = this;
      pages.forEach(function(page) {
        var promise = self._map.get(page);
        if (!promise) {
          console.log("Pre-fetching page", page);
          promise = book.displayPage(page);
          self._map.set(page, promise);
          promise.then(
            function onSuccess(e) {
              console.log("Pre-fetching complete", page);
              return e;
            },
            function onError(e) {
              console.log("Pre-fetching failed", page, e);
              throw e;
            }
          );
        } else {
          console.log("Page alread pre-fetched", page);
        }
      });
      // Cleaning up cache
      for (var [k, val] of this._map) {
        if (k < pageNum - self._bufferBefore || k > pageNum + self._bufferAfter) {
          console.log("Removing from cache page", pageNum);
          if ("dispose" in val) {
            val.dispose();
          }
          self._map.delete(k);
        }
      };
      // Finally return the intended page
      return this._map.get(pageNum);
    }
  };


  // File picker
  var eltFilePickerControl = document.getElementById("pick_file_control");
  var eltFilePickerTab = document.getElementById("pick_file_tab");
  var eltPages = document.getElementById("pages");
  var eltWelcome = document.getElementById("welcome");

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
    book = new obj.Book(files);
    Pages.display(currentPage = 0);
    eltWelcome.style.display = "none";
  });

  var onkey = function onkey(event) {
    if (!book) {
      return;
    }
    var code;
    if ("keyCode" in event || "which" in event) {
      code = event.keyCode || event.which;
      if ( // FIXME: Chrome doesn't define KeyEvent
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
      Pages.display(currentPage);
    }
  };

  document.addEventListener("keypress", onkey);


  // Debugging code

  window.OpenBerg = {
    Pages: Pages
  };
})(this);