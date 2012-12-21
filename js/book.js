(function(obj) {
  "use strict";

  var console = window.console;
  var Promise = window["promise/core"];
  var log = (function(){
    var logger = console.log.bind(console.log, "Book");
    return function(...args) {
      if (obj.OpenBerg.options.debugBook) {
        logger.apply(null, args);
      }
    };
  })();

  var Book = function Book(files) {
    if (!files || files.length != 1) {
      throw new Error("Books composed of several files are not "+
                      "implemented yet");
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
            log("Pushing entries", entries);
            self._rangeMap.push(entries);
            deferred.resolve();
          });
        },
        function onError(e) {
          log("_updateEntries error", e);
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
          log("Fetching entry", page, "in", self._rangeMap);
          var currentRange = self._rangeMap[0];
          if (page < 0) {
            throw new Book.NoSuchPageError(page, 0);
          } else if (page >= currentRange.length) {
            throw new Book.NoSuchPageError(page,
              currentRange.length - 1);
          }
          var pageEntry = currentRange[page];
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
  Book.Error.prototype = Object.create(window.Error.prototype);

  Book.NoSuchPageError = function NoSuchPageError(pageNum, closestPageNum) {
    console.log("NoSuchPageError");
    Book.Error.call(this, "No such page");
    this._pageNum = pageNum;
    this._closestPageNum = closestPageNum;
  };
  Book.NoSuchPageError.prototype = Object.create(Book.Error.prototype);
  Book.NoSuchPageError.prototype.toString = function toString() {
    return "No such page: " + this._pageNum +
      " (closest valid page is " + this._closestPageNum + ")";
  };

  /**
   * A page of a comics
   *
   * @constructor
   */
  Book.ComicsPage = function ComicsPage(data) {
    this.imgURL = window.URL.createObjectURL(data);
  };
  Book.ComicsPage.prototype = {
    // Clean up any resource associated with the page
    dispose: function dispose() {
      window.URL.revokeObjectURL(this.imgURL);
    }
  };

  const RESOLVED = Promise.resolve();

  obj.Book = Book;
})(window);
