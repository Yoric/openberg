(function(obj) {
  "use strict";

  var console = window.console;
  var Promise = window["promise/core"];

  var Book = function Book(files) {
    this._files = files;
    this._filesIndex = 0;
    this._entries = null;
    this._entriesIndex = -1;
    this._status = null; // Filled by _updateEntries
    this._updateEntries();
  };
  Book.prototype = {
    /**
     * @type {Promise} a promise resolved in case of success,
     * rejected with an exception in case of error.
     */
    get status() {
      return this._status;
    },
    /**
     * Fills _status
     * @return {Promise}
     */
    _updateEntries: function _updateEntries() {
      var deferred = Promise.defer();
      var self = this;
      obj.zip.createReader(
        new obj.zip.BlobReader(this._files[this._filesIndex]),
        function onSuccess(zip) {
          zip.getEntries(function onEntries(entries) {
            console.log("Setting entries", entries);
            self._entries = entries;
            deferred.resolve();
          });
        },
        function onError(e) {
          console.log("_updateCurrentReader error", e);
          deferred.reject();
        });
      return self._status = deferred.promise;
    },
    displayDelta: function displayDelta(elt, delta) {
      if (typeof delta != "number") {
        throw new TypeError();
      }
      var self = this;
      return this.status.then(
        function onInitialized() {
          // FIXME: This is optimized for delta = +1 or -1
          // FIXME: If necessary, we could optimize for other cases
          if (delta > 0) {
            // Check if we have reached the end of the file
            if (self._entriesIndex + delta >= self._entries.length) {
              if (self._filesIndex + 1 >= self._files.length) {
                return Promise.reject(Book.Error.NO_MORE_PAGES);
              }
              self._entriesIndex = -1;
              self._filesIndex++;
              return self._updateEntries().then(
                function onSuccess() {
                  return self.displayDelta(elt, delta - 1);
                }
              );
            }
          } else if (delta < 0) {
           if (self._entriesIndex + delta < 0) {
              if (self._filesIndex <= 0) {
                return Promise.reject(Book.Error.NO_MORE_PAGES);
              }
              self._filesIndex--;
              return self._updateEntries().then(
                function onSuccess() {
                  self._entriesIndex = self._entries.length - 1;
                  return self.displayDelta(elt, delta - 1);
                }
              );
            }
          }
          self._entriesIndex += delta;
          var entry = self._entries[self._entriesIndex];
          if (entry.directory) {
            elt.innerHTML = "";
            elt.textContent = "Directory " + entry.filename;
            return RESOLVED;
          }
          var deferred = Promise.defer();
          entry.getData(
            new obj.zip.BlobWriter(),
            function onEnd(data) {
              var eltImg = document.createElement("img");
              elt.appendChild(eltImg);
              var reader = new FileReader(data);
              reader.onload = function onLoad(e) {
                eltImg.src = e.target.result;
              };
              reader.readAsDataURL();
              deferred.resolve();
            }, null);
            return deferred.promise;
          });
    },
    /**
     * Asynchronously decode the next page and display it on
     * element |elt|.
     */
    displayNext: function(elt) {
      return this.displayDelta(elt, 1);
    },
    /**
     * Asynchronously decode the previous page and display it on
     * element |elt|.
     */
    displayPrev: function(elt) {
      return this.displayDelta(elt, -1);
    }
  };

  Book.Error = function Error(message) {
    window.Error.call(this, message);
  };
  Book.Error.NO_MORE_PAGES = new Book.Error("Moving beyond the last page");

  const RESOLVED = Promise.resolve();

  obj.Book = Book;
})(window);
