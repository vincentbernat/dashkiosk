// Simple drag'n'drop directive.

angular.module('dashkiosk.directives')
  .directive('dkDraggable', function() {
    'use strict';

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        element
          .attr('draggable', 'true')
          .on('dragstart', function(event) {
            element.addClass('dragged');
            event.dataTransfer.effectAllowed = 'move';
            // If we use setData, we cannot read the data in anything
            // else than the drop event. That's quite
            // convenient. Therefore, we encode the value into the
            // attribute name...
            event.dataTransfer.setData(element.attr('data-drag-type'),
                                       attrs.dkDraggable);
          })
          .on('dragend', function() {
            element.removeClass('dragged');
          });
      }
    };
  })
  .directive('dkDroppable', function() {
    'use strict';

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        var accept = function(event) {
          var acceptables = _.keys(scope.$eval(attrs.dkDroppable));
          return !!_.intersection(event.dataTransfer.types, acceptables);
        };

        var counter = 0;

        element
          .on('dragover', function(event) {
            if (!accept(event)) {
              return true;
            }
            if (event.preventDefault) {
              event.preventDefault();
            }
            return false;
          })
          .on('dragenter', function(event) {
            counter++;
            if (!accept(event)) {
              event.dataTransfer.effectAllowed = 'none';
              event.dataTransfer.dropEffect = 'none';
              return true;
            }
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.dropEffect = 'move';
            element.addClass('droppable');
            return false;
          })
          .on('dragleave', function() {
            counter--;
            if (counter === 0) {
              element.removeClass('droppable');
            }
            return false;
          })
          .on('drop', function(event) {
            if (!accept(event)) {
              return true;
            }
            if (event.stopPropagation) {
              event.stopPropagation();
            }
            counter = 0;
            element.removeClass('droppable');
            var fns = scope.$eval(attrs.dkDroppable);
            _.each(fns, function(fn, type) {
              var value = event.dataTransfer.getData(type);
              if (value !== '') {
                console.debug('[Dashkiosk] Drag\'n\'drop accepts ' + type + ' from ' + value);
                fn(value);
              }
            });
            return false;
          });
      }
    };
  });
