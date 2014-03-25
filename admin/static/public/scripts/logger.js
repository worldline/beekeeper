define(['config', 'jquery'], function(config, $) {
  var reportUri = config.apiUrl + '/errors';

  function report() {
    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: reportUri,
      data: {
        e: JSON.stringify(Array.prototype.slice.apply(arguments))
      }
    });
  }

  window.onerror = report;

  $(document).ajaxError(function(e, xhr, settings) {
    if (settings.url !== reportUri && xhr.status !== 401) {
      report(settings.url, xhr.status, xhr.responseText);
    }
  });

  return report;
});