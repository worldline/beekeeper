define(['modal'], function() {
  var modal = $('#bkModal');
  var title = modal.find('.modal-title');
  var body = modal.find('.modal-body');

  return function(options) {
    setTimeout(function() {
      title.text(options.title);
      body.text(options.body);
      modal.modal('show');
    }, 0);
  };
})
