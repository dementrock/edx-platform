// Wrapper for RequireJS. It will make the standard requirejs(), require(), and
// define() functions from Require JS available inside the anonymous function.
//
// See https://edx-wiki.atlassian.net/wiki/display/LMS/Integration+of+Require+JS+into+the+system
(function (requirejs, require, define) {

define(['logme', 'update_input'], function (logme, updateInput) {
    return Draggables;

    function Draggables(state) {
        var _draggables, numDraggables;

        numDraggables = state.config.draggables.length;
        _draggables = [];
        state.draggables = [];

        (function (i) {
            while (i < numDraggables) {
                processDraggable(state.config.draggables[i], i + 1);
                i += 1;
            }

            if (state.individualTargets === false) {
                updateInput(state, true);
            }
        }(0));

        state.currentMovingDraggable = null;

        $(document).mousemove(function (event) {
            normalizeEvent(event);

            if (state.currentMovingDraggable !== null) {
                state.currentMovingDraggable.css('left', event.pageX - state.baseImageEl.offset().left - 50);
                state.currentMovingDraggable.css('top', event.pageY - state.baseImageEl.offset().top - 50);
            }
        });

        return;

        function processDraggable(obj, objIndex) {
            var draggableContainerEl, imgEl, inContainer, ousePressed,
                onTarget, draggableObj, marginCss;

            draggableContainerEl = $(
                '<div ' +
                    'style=" ' +
                        'width: 100px; ' +
                        'height: 100px; ' +
                        'display: inline; ' +
                        'float: left; ' +
                        'overflow: hidden; ' +
                        'z-index: ' + objIndex + '; ' +
                        'border: 1px solid gray; ' +
                    '" ' +
                    'data-draggable-position-index="' + objIndex + '" ' +
                    '></div>'
            );

            if (obj.icon.length > 0) {
                imgEl = $(
                    '<img ' +
                        'src="' + state.config.imageDir + '/' + obj.icon + '" ' +
                    '/>'
                );

                draggableContainerEl.append(imgEl);
            }

            if (obj.label.length > 0) {
                marginCss = '';

                if (obj.icon.length === 0) {
                    marginCss = 'margin-top: 38px;';
                }

                draggableContainerEl.append(
                    $('<div style="clear: both; text-align: center; ' + marginCss + ' ">' + obj.label + '</div>')
                );
            }

            draggableContainerEl.appendTo(state.sliderEl);
            _draggables.push(draggableContainerEl);

            inContainer = true;
            mousePressed = false;

            onTarget = null;

            draggableObj = {
                'id': obj.id,
                'el': draggableContainerEl,
                'x': -1,
                'y': -1,

                'setInContainer': function (val) { inContainer = val; },
                'setOnTarget': function (val) { onTarget = val; },
            };
            state.draggables.push(draggableObj);

            draggableContainerEl.mousedown(mouseDown);
            draggableContainerEl.mouseup(mouseUp);
            draggableContainerEl.mousemove(mouseMove);

            if (objIndex + 1 === numDraggables) {
                state.draggablesLoaded = true;

                state.updateArrowOpacity();
            }

            return;

            function mouseDown(event) {
                if (mousePressed === false) {
                    state.currentMovingDraggable = draggableContainerEl;
                    normalizeEvent(event);

                    if (inContainer === true) {
                        draggableContainerEl.detach();
                        draggableContainerEl.css('border', 'none');
                        draggableContainerEl.css('position', 'absolute');
                        draggableContainerEl.css('left', event.pageX - state.baseImageEl.offset().left - 50);
                        draggableContainerEl.css('top', event.pageY - state.baseImageEl.offset().top - 50);
                        draggableContainerEl.appendTo(state.baseImageEl.parent());

                        inContainer = false;
                    }

                    draggableContainerEl.attr('data-old-z-index', draggableContainerEl.css('z-index'));
                    draggableContainerEl.css('z-index', '1000');

                    mousePressed = true;
                    event.preventDefault();
                }
            }

            function mouseUp(event) {
                if (mousePressed === true) {
                    state.currentMovingDraggable = null;
                    normalizeEvent(event);

                    checkLandingElement(event);
                }
            }

            function mouseMove() {
                if (mousePressed === true) {
                    draggableContainerEl.css('left', event.pageX - state.baseImageEl.offset().left - 50);
                    draggableContainerEl.css('top', event.pageY - state.baseImageEl.offset().top - 50);
                }
            }

            function checkLandingElement(event) {
                var offsetDE, indexes, DEindex, targetFound;

                mousePressed = false;

                offsetDE = draggableContainerEl.position();

                if (state.individualTargets === false) {
                    if (
                        (offsetDE.left < 0) ||
                        (offsetDE.left + 100 > state.baseImageEl.width()) ||
                        (offsetDE.top < 0) ||
                        (offsetDE.top + 100 > state.baseImageEl.height())
                    ) {
                        moveBackToSlider();

                        draggableObj.x = -1;
                        draggableObj.y = -1;
                    } else {
                        correctZIndexes();

                        draggableObj.x = offsetDE.left + 50;
                        draggableObj.y = offsetDE.top + 50;
                    }
                } else if (state.individualTargets === true) {
                    targetFound = false;

                    checkIfOnTarget();

                    if (targetFound === true) {
                        correctZIndexes();
                    } else {
                        moveBackToSlider();
                        removeObjIdFromTarget();
                    }
                }

                state.updateArrowOpacity();

                updateInput(state);

                return;

                function removeObjIdFromTarget() {
                    var c1;

                    if (onTarget !== null) {
                        c1 = 0;

                        while (c1 < onTarget.draggable.length) {
                            if (onTarget.draggable[c1] === obj.id) {
                                onTarget.draggable.splice(c1, 1);

                                break;
                            }
                            c1 += 1;
                        }

                        onTarget = null;
                    }
                }

                function checkIfOnTarget() {
                    var c1, target;

                    for (c1 = 0; c1 < state.targets.length; c1++) {
                        target = state.targets[c1];

                        if (offsetDE.top + 50 < target.offset.top) {
                            continue;
                        }
                        if (offsetDE.top + 50 > target.offset.top + target.h) {
                            continue;
                        }
                        if (offsetDE.left + 50 < target.offset.left) {
                            continue;
                        }
                        if (offsetDE.left + 50 > target.offset.left + target.w) {
                            continue;
                        }

                        if (
                            (state.config.one_per_target === true) &&
                            (target.draggable.length === 1) &&
                            (target.draggable[0] !== obj.id)
                        ) {
                            continue;
                        }

                        targetFound = true;

                        removeObjIdFromTarget();
                        onTarget = target;

                        target.draggable.push(obj.id);
                        snapToTarget(target);

                        break;
                    }
                }

                function snapToTarget(target) {
                    draggableContainerEl.css('left', target.offset.left + 0.5 * target.w - 50);
                    draggableContainerEl.css('top', target.offset.top + 0.5 * target.h - 50);
                }

                function correctZIndexes() {
                    var c1;

                    c1 = 0;

                    while (c1 < _draggables.length) {
                        if (parseInt(draggableContainerEl.attr('data-old-z-index'), 10) < parseInt(_draggables[c1].css('z-index'), 10)) {
                            _draggables[c1].css('z-index', parseInt(_draggables[c1].css('z-index'), 10) - 1);
                        }
                        c1 += 1;
                    }

                    draggableContainerEl.css('z-index', c1);
                }

                function moveBackToSlider() {
                    var c1;

                    draggableContainerEl.detach();
                    draggableContainerEl.css('position', 'static');

                    indexes = [];
                    DEindex = parseInt(draggableContainerEl.attr('data-draggable-position-index'), 10);

                    state.sliderEl.children().each(function (index, value) {
                        indexes.push({
                            'index': parseInt($(value).attr('data-draggable-position-index'), 10),
                            'el': $(value)
                        });
                    });

                    c1 = 0;

                    while (c1 < indexes.length) {
                        if ((inContainer === false) && (indexes[c1].index > DEindex)) {
                            indexes[c1].el.before(draggableContainerEl);
                            inContainer = true;
                        }

                        c1 += 1;
                    }

                    if (inContainer === false) {
                        draggableContainerEl.appendTo(state.sliderEl);
                        inContainer = true;
                    }

                    draggableContainerEl.css('border', '1px solid gray');
                }
            }
        }

        function normalizeEvent(event) {
            if(!event.offsetX) {
                event.offsetX = (event.pageX - $(event.target).offset().left);
                event.offsetY = (event.pageY - $(event.target).offset().top);
            }
            return event;
        }
    }
});

// End of wrapper for RequireJS. As you can see, we are passing
// namespaced Require JS variables to an anonymous function. Within
// it, you can use the standard requirejs(), require(), and define()
// functions as if they were in the global namespace.
}(RequireJS.requirejs, RequireJS.require, RequireJS.define)); // End-of: (function (requirejs, require, define)
