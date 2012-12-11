(function(obj) {
  // Setup zip
  obj.zip.workerScriptsPath = "lib/zip.js/WebContent/";


  // File picker
  var eltFilePicker = document.getElementById("pick_file");
  var eltFilePickerUL = document.getElementById("pick_file_ul");

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
    var book = new obj.Book(files);
    book.displayNext(document.getElementById("welcome")).then(
      function onSuccess() {
        console.log("Display success");
      },
      function onError(e) {
        console.log("Display error", e);
      }
    );
//    flipBook.display(book);
  });

})(this);