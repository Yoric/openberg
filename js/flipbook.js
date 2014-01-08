(function(obj) {

  // Dependencies

  var console = obj.console;
  var Promise = obj["promise/core"];

  var FlipBook = function FlipBook(parent, options, readerOptions) {
    this._map = null;
    this._bufferBefore = options.bufferBackwardsSize;
    this._bufferAfter = options.bufferForwardsSize;
    this._book = null;
    this._page = 0;
    this._previousPage = -1;
    this._parent = parent;
    this._readerOptions = readerOptions;
    this._displayClass = "left";
  };

  FlipBook.prototype = {
    get book() {
      return this._book;
    },
    set book(book) {
      if (book === this._book) {
        return;
      }

      this._book = book;

      // New book? Clean up cache
      if (this._map) {
        for (var [k, val] of this._map) {
          if ("dispose" in val) {
            val.dispose();
          }
        };
      }
      this._map = new window.Map();

      // New book? Start at page 0, by default.
      this._page = 0;
    },
    set page(page) {
      if (!this._book) {
        return;
      }
      if (this._page == page) {
        return;
      }
      this._previousPage = this._page;
      this._page = page;
    },
    get page() {
      return this._page;
    },
    set readerOptions(options) {
      this._readerOptions = options;
    },
    get readerOptions() {
      return this._readerOptions;
    },
    set displayClass(option) {
      this._displayClass = option;
    },
    get displayClass() {
      return this._displayClass;
    },
    display: function display() {
      console.log("Display of page", this.page,
      "has been requested - I come from page", this._previousPage);
      var page = this.page;
      var promise = this.fetch(page);
      var self = this;
      var eltPages = this._parent;
      var readerOptions = this.readerOptions;
      var displayClass = this.displayClass;
      var bookName = this.book.bookName;

      return Promise.withLog(promise.then(
        function onSuccess(data) {
          var log = window.console.log.bind(window.console, "display onSucess");
          log("I should now display the data for page", page);
          if (page != self.page) {
            log("FIXME", "Do not display", pageNum, "we have moved away from that page");
          }
          eltPages.className = "removeImage " + displayClass;
          if ("directory" in data) {
            log("Page is a directory", data.directory);
            var dir = document.createElement("DIV");
            dir.classList.add("icon-folder");
            var dirbr = document.createElement('br');
            var dirtxt = document.createTextNode("Directory " + data.directory);

            eltPages.appendChild(dir);
            eltPages.appendChild(dirbr);
            eltPages.appendChild(dirtxt);

            //Remove class to fire css effect
            eltPages.classList.remove("removeImage");
            return;
          }
          if ("imgURL" in data) {
            log("Page is an image");
            var date1 = Date.now();

            eltPages.innerHTML = "";
            var img = document.createElement("img");
            eltPages.appendChild(img);
            eltPages.scrollTop = 0;
            eltPages.style.overflowY = "hidden";
            eltPages.style.width = "100%";
            img.src = data.imgURL;

            // Type of Visualization
            function loadVisualization() {
              if (readerOptions.zoom) {
              // Zoom ON
              // Fixme - zoom deactivated - search for an open source solution or make our own
                 if (readerOptions.fitwidth) {
                //Fit width
                  eltPages.style.overflowY = "auto";
                  img.style.width = "100%";
                  eltPages.style.width = eltPages.parentElement.clientWidth + $.scrollbarWidth() + "px";
                } else {
                //Fit height
                  img.style.height = "100%";
                }
              } else {
              // Zoom OFF
                if (readerOptions.fitwidth) {
                //Fit width
                  eltPages.style.overflowY = "auto";
                  img.style.width = "100%";
                  eltPages.style.width = eltPages.parentElement.clientWidth + $.scrollbarWidth() + "px";
                } else {
                //Fit height
                  img.style.height = "100%";
                }
              }

            }

            img.onload = loadVisualization;

            //Remove class to fire css effect
            eltPages.classList.remove("removeImage");

            // Save actual page in LocalStorage
            if ( typeof(Storage)!=="undefined"  && readerOptions.rememberpage) {
              localStorage.setItem( bookName + "_page", page );
            }

            return;
          }
          console.error("Unrecognized data", data);
          throw new Error("Unrecognized data");
        }),
        function onError(e) {
          console.log("No such page");
        });
    },
    fetch: function fetch(pageNum) {
      // Don't bother fetching the page if it is negative
      if (pageNum < 0) {
        Promise.reject(new obj.Book.NoSuchPageError(pageNum, 0));
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
          promise = self.book.displayPage(page);
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
          console.log("Removing from cache page", k);
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

  obj.FlipBook = FlipBook;
})(window);