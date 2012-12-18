(function(obj) {
  "use strict";

  var console = window.console;
  var Promise = window["promise/core"];

  var Book = function Book(files) {
    if (!files || files.length != 1) {
      throw new Error("NOT IMPLEMENTED");
    }
    this._files = files;
    this._filesProcessed = 0;
    this._rangeMap = [];
    this._status = null;
    this._updateEntries();
  };
  Book.prototype = {
    /**
     * Fills _status, _rangeMap
     * @return {Promise}
     */
    _updateEntries: function _updateEntries() {
      var deferred = Promise.defer();
      var self = this;
      obj.zip.createReader(
        new obj.zip.BlobReader(this._files[this._filesProcessed++]),
        function onSuccess(zip) {
          zip.getEntries(function onEntries(entries) {
            console.log("Pushing entries", entries);
            self._rangeMap.push(entries);
            deferred.resolve();
          });
        },
        function onError(e) {
          console.log("_updateEntries error", e);
          deferred.reject();
        });
      return self._status = deferred.promise;
    },
    displayPage: function displayPage(page) {
      // Search page in range map
      // FIXME: Todo
      /*
      // FIXME If we deal with many files, we
      // could optimize with a binary search
      var pageEntry = null;
      var total = 0;
      while (!pageEntry) {
        for (var i = 0; i < this._filesProcessed; ++i) {
          var range = this._rangeMap[i];
          var rangeEnd = total + range.length;
          if (rangeEnd > page) {
            // Page is somewhere in the current range
            pageEntry = this._rangeMap[page - total];
            break;
          }
        }
        if (!pageEntry) {
          if (this._filesProcessed < this._files.length) {
            var promise = this._updateEntries();
          }
        }
        // FIXME process more files
      }
       */
      var self = this;
      return this._status.then(
        function afterInit() {
          console.log("Fetching entry", page, "in", self._rangeMap);
          var pageEntry = self._rangeMap[0][page];
          if (!pageEntry) {
            return REJECT_NO_MORE_PAGES;
          }
          console.log("Entry", pageEntry.fileName);
          if (pageEntry.directory) {
            console.log("Entry is a directory");
            return {directory: pageEntry.filename};
          }
          var deferred = Promise.defer();

          pageEntry.getData(
            new obj.zip.BlobWriter(),
            function onEnd(data) {
              console.log("Entry", page, "extracted");
              deferred.resolve(new Book.ComicsPage(data));
            }, null);
          return deferred.promise;
        }
      );
    }
  };
  Book.Error = function Error(message) {
    window.Error.call(this, message);
  };
  Book.Error.NO_MORE_PAGES = new Book.Error("Moving beyond the last page");

  Book.ComicsPage = function ComicsPage(data) {
    this.imgURL = window.URL.createObjectURL(data);
  };
  Book.ComicsPage.prototype = {
    // Clean up any resource associated with the page
    dispose: function dispose() {
      window.URL.revokeObjectURL(this.imgURL);
    }
  };

  const REJECT_NO_MORE_PAGES = Promise.reject(Book.Error.NO_MORE_PAGES);
  const RESOLVED = Promise.resolve();

  obj.Book = Book;
})(window);
