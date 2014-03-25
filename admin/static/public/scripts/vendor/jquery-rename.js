(function($) {

  $.fn.rename = function rename(onRename) {

    var editable = $(this).is('[data-editable]') ? $(this) : $(this).find('[data-editable]').first();

    editable.each(function() {
      var oldName = editable.text(),
        editor = editable.hide().after('<input data-editor type="text" value="' + oldName + '"></input>').next()

        editable.trigger('show-editor', editor);

      function removeEditor() {
        var newName = editor.val();

        //console.log('old name:', oldName, '/ new name:', newName);
        editable.trigger('remove-editor', editor);
        editor.remove();

        editable.attr('data-previous-name', oldName).text(newName).show();

        if (newName != oldName) editable.trigger('rename', newName, oldName)

      }



      editor.width(editable.width() * 1.2).height(editable.height()).focus().on('keydown', function(event) {
        if (~ [13 /*Enter*/ , 27 /*Esc*/ ].indexOf(event.keyCode)) {
          editor.blur();
          return false
        }
      }).on('blur focusout submit', removeEditor);
    })
    if (onRename) editable.one('rename', function(e, newName, oldName) {
      onRename(newName, oldName)
    });

    var sel = window.getSelection();
    if (sel) sel.collapseToStart();


    return false;
  }
  return false;
})(jQuery);