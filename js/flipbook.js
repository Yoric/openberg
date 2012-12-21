(function(obj) {

  // Dependencies

  var console = obj.console;
  var Promise = obj["promise/core"];


  var FlipBook = function FlipBook(parent, options) {
    this._map = new window.Map();
    this._bufferBefore = options.bufferBackwardsSize;
    this._bufferAfter = options.bufferForwardsSize;
    this._book = null;
    this._page = 0;
    this._previousPage = -1;
    this._parent = parent;
  };
  FlipBook.prototype = {
    get book() {
      return this._book;
    },
    set book(book) {
      this._book = book;
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
    display: function display() {
      console.log("Display of page", this.page,
      "has been requested - I come from page", this._previousPage);
      var page = this.page;
      var promise = this.fetch(page);
      var self = this;
      var eltPages = this._parent;
      eltPages.classList.add("loading");
      return Promise.withLog(promise.then(
        function onSuccess(data) {
          var log = window.console.log.bind(window.console, "display onSucess");
          log("I should now display the data for page", page);
          if (page != self.page) {
            log("FIXME", "Do not display", pageNum, "we have moved away from that page");
          }
          eltPages.classList.remove("loading");
          if ("directory" in data) {
            log("Page is a directory", data.directory);
            eltPages.textContent = "Directory " + data.directory;
            return;
          }
          if ("imgURL" in data) {
            log("Page is an image");
            var date1 = Date.now();
            eltPages.innerHTML = "";
            var img = document.createElement("img");
            eltPages.appendChild(img);
            img.src = data.imgURL;
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

  obj.FlipBook = FlipBook;
})(window);