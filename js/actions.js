(function(Reflux, window) {
    'use strict';

    var Todo = Reflux.createActions([
        "toggle",
        "toggleAll",
        "add",
        "remove",
        "clearCompleted",
        "edit"
    ]);

    window.Todo = Todo;

})(window.Reflux, window);
