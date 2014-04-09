// Simple drag'n'drop directive.

// The source node is expected to have a `data-drag-type` attribute
// that should match the `data-drag-accept` on the destination node.

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
          var acceptable = element.attr('data-drag-accept');
          return (!acceptable ||
                  _.contains(event.dataTransfer.types, acceptable));
        };

        var first = false, second = false;

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
            if (first) {
              second = true;
              return true;
            } else {
              first = true;
              if (!accept(event)) {
                event.dataTransfer.effectAllowed = 'none';
                event.dataTransfer.dropEffect = 'none';
                return true;
              }
              element.addClass('droppable');
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.dropEffect = 'move';
              return false;
            }
          })
          .on('dragleave', function() {
            if (second) {
              second = false;
            } else if (first) {
              first = false;
            }
            if (!first && !second) {
              element.removeClass('droppable');
              return false;
            }
            return true;
          })
          .on('drop', function(event) {
            if (!accept(event)) {
              return true;
            }
            if (event.stopPropagation) {
              event.stopPropagation();
            }
            element.removeClass('droppable');
            var fn = scope.$eval(attrs.dkDroppable);
            if ('undefined' !== typeof fn) {
              var value = event.dataTransfer.getData(element.attr('data-drag-accept'));
              fn(value || undefined);
            }
            return false;
          });
      }
    };
  });
