define(['underscore', 'mentions', 'config', 'caret', 'elastic'], function(_, mentions, config) {
  var cache = {};

  function findCurrentType(trimmed, virtualcaret) {
    var matched = trimmed.match(/\(([a-z]*)\(([^\(\)]*)\)\)*$/),
      currentType = (matched && matched.length === 3) ? matched[1] : '',
      tmp, last;

    if (currentType === '') {
      tmp = trimmed.match(/(\w+)\(([\w,\s]|\||\.)*/g)
      if (tmp) {
        last = _.last(tmp)
        if (trimmed.lastIndexOf(last) === (virtualcaret - last.length)) {
          matched = last.match(/(\w+)\([\w,\s]*/)
          currentType = (matched && matched.length === 2) ? matched[1] : '';
        }
      }
    }
    return currentType;
  }

  return function(textFields, childOfList, types) {
    textFields.each(function(jqueryIndex, mentions) {
      var jqmentions = $(mentions);
      jqmentions.mentionsInput({
        triggerChar: ['.', ',', ' ', '+', '-', '*', '/'],
        defaultTriggerChar: ' ',
        defaultClosingChar: ')',
        minChars: '0',
        defaultMoveCarat: -2,
        trim: true,
        onDataRequest: function(mode, query, callback, triggerChar) {
          if (triggerChar === '') {
            triggerChar = ' ';
          }
          var reducers = ['sum', 'min', 'max', 'avg', 'distinct', 'median'],
            filters = ['in', 'eq', 'gt', 'ge', 'lt', 'le', 'ne', 'exists', 're'],
            topush = [],
            data = [];

          function filterAndPush(data) {
            query = query.trim().toLowerCase();
            data = _.filter(data, function(item) {
              return item.name.toLowerCase().indexOf(query) > -1
            });

            callback.call(this, data);
          }

          function returnWithParenthesis(el) {
            return {
              id: el + Date.now(),
              name: el + '(',
              type: el,
              trigger: triggerChar
            }
          }

          if (triggerChar === '.') {
            //operator and childof
            data = _.map(filters, returnWithParenthesis);
            childOfList.forEach(function(el, index) {
              data.push({
                id: +index + 1 + Date.now(),
                name: 'childOf(#' + (index + 1),
                type: 'childof',
                trigger: triggerChar
              })
            })
            return filterAndPush(data);
          } else {
            var trimmed = jqmentions.val().replace(/ /g, ''),
              virtualcaret = trimmed.lastIndexOf(jqmentions.val().substr(jqmentions.caret()).replace(/ /g, '')),
              currentType = findCurrentType(trimmed, virtualcaret);

            var onceCurrentType = function(keys, shouldType) {
              topush = shouldType ? types : reducers.concat(types),

              data = keys.length > 0 ? _.map(keys, function(el) {
                return {
                  id: el + Date.now(),
                  name: el,
                  type: el,
                  trigger: triggerChar,
                  closing: ' '
                }
              }) : _.map(topush, returnWithParenthesis);

              return filterAndPush(data);
            };

            if (!currentType.length) {
              return onceCurrentType([])
            }
            if (reducers.indexOf(currentType) !== -1) {
              return onceCurrentType([], true)
            }

            // maybe we are in an filters
            if (filters.indexOf(currentType) !== -1) {
              // Find the corresponding type for the filter (memory().eq(a, 1) => memory)
              var cl = trimmed.substr(0, virtualcaret),
                type = cl.match(/([a-z]*)\([^()]*\)(\.[^.()]*\([^()]*\))*\.[^.()]*\([^()]*$/);
              if (!(type && type.length > 1)) {
                return;
              }
              currentType = type[1];
            }

            if (cache[currentType]) {
              // Take the collection's keys from the cache
              return onceCurrentType(cache[currentType]);
            }

            // Fetch collection's keys
            $.ajax({
              url: config.apiUrl + '/types/' + currentType + '/keys',
              dataType: 'json',
              success: function(data) {
                if (data && data.results) {
                  cache[currentType] = _.pluck(data.results, '_id');
                }
                return onceCurrentType(cache[currentType]);
              }
            });
          }
        }
      });
    });
  }
})