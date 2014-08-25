(function(Reflux, Actions, window) {
    'use strict';

    var todoCounter = 0,
        localStorageKey = "todos";

    function persistList(list) {
        localStorage.setItem(localStorageKey, JSON.stringify(list));
    }

    function loadList() {
        var loadedList = localStorage.getItem(localStorageKey);
        if (!loadedList) {
            // If no list is in localstorage, start out with a default one
            return [
                {
                    key: todoCounter++,
                    created: new Date(),
                    isComplete: false,
                    label: 'Rule the web'
                }
            ];
        }
        return _.map(JSON.parse(loadedList), function(item) {
            // just resetting the key property for each todo item
            item.key = todoCounter++;
            return item;
        });
    }

    window.todoListStore = Reflux.createStore({
        init: function() {
            this.list = loadList();

            this.listenTo(Todo.toggle, this.toggleItem);
            this.listenTo(Todo.toggleAll, this.toggleAll);
            this.listenTo(Todo.add, this.addItem);
            this.listenTo(Todo.remove, this.removeItem);
            this.listenTo(Todo.clearCompleted, this.clearCompleted);
            this.listenTo(Todo.edit, this.editItem);
        },
        editItem: function(itemKey, newLabel) {
            var foundItem = _.find(this.list, function(item) {
                return item.key === itemKey;
            });
            if (!foundItem) {
                return;
            }
            foundItem.label = newLabel;
            this.trigger(this.list);
        },
        addItem: function(label) {
            this.list.push({
                key: todoCounter++,
                created: new Date(),
                isComplete: false,
                label: label
            });
            this.trigger(this.list);
        },
        removeItem: function(itemToRemove) {
            _.pull(this.list, itemToRemove);
            this.trigger(this.list);
        },
        toggleItem: function(itemToToggle, isComplete) {
            var foundItem = _.find(this.list, function(item) {
                return itemToToggle.key === item.key;
            });
            if (foundItem) {
                foundItem.isComplete = isComplete;
                this.trigger(this.list);
            }
        },
        toggleAll: function(checked) {
            this.list = _.map(this.list, function(item) {
                item.isComplete = checked;
                return item;
            });
            this.trigger(this.list);
        },
        clearCompleted: function() {
            this.list = _.filter(this.list, function(item) {
                return !item.isComplete;
            });
            this.trigger(this.list);
        },
        getDefaultData: function() {
            return this.list;
        }
    });

    // listen to changes on the todo list and persist it
    window.todoListStore.listen(function(todoList) {
        persistList(todoList);
    });

})(window.Reflux, window.Actions, window);
