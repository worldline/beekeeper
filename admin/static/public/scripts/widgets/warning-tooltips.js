define(['jquery', 'nvd3'], function($, nv) {
  var $body = $('body'),
    warningTooltip = nv.models.tooltip()
      .gravity('n')
      .distance(1)
      .snapDistance(0)
      .contentGenerator(function(d) {
        var warning = d.series[0];
        return '<p style="color: red;">' + $(warning).data('error') + '</p>';
      });

  $body.on('mouseenter', '.data-warning', function(event) {
    warningTooltip
      .chartContainer(this)
      .position({
        left: event.target.clientWidth / 2
      })
      .data({
        series: [event.originalEvent.target]
      })
    ();
  }).on('mouseout', '.data-warning', function() {
    $(this).find('.nvtooltip').css('opacity', 0);
  });
});
