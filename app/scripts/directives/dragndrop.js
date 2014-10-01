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

        var makeDroppable = (function() {
          var droppable = false;
          return function(on) {
            droppable = on;
            setTimeout(function() {
              if (droppable) {
                element.addClass('droppable');
              } else {
                element.removeClass('droppable');
              }
            }, 100);
          };
        })();

        element
          .on('dragover', function(event) {
            if (!accept(event)) {
              return true;
            }
            makeDroppable(true);
            if (event.preventDefault) {
              event.preventDefault();
            }
            return false;
          })
          .on('dragenter', function(event) {
            console.debug('dragenter', element);
            if (!accept(event)) {
              event.dataTransfer.effectAllowed = 'none';
              event.dataTransfer.dropEffect = 'none';
              return true;
            }
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.dropEffect = 'move';
            makeDroppable(true);
            return false;
          })
          .on('dragleave', function() {
            console.debug('dragleave', element);
            makeDroppable(false);
            return false;
          })
          .on('drop', function(event) {
            if (!accept(event)) {
              return true;
            }
            if (event.stopPropagation) {
              event.stopPropagation();
            }
            makeDroppable(false);
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
