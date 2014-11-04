/** @jsx React.DOM */

function isEnterKeyPressed(evt) {
    return evt.which === 13;
}

function isEscapeKeyPressed(evt) {
    return evt.which === 27;
}

function isNotEmpty(text) {
    return text && text !== "";
}

var TodoItem = React.createClass({
    mixins: [React.addons.LinkedStateMixin],
    getDefaultProps: function() {
        return {
            item: {
                isComplete: false,
                label: ''
            }
        };
    },
    buildState: function(item) {
        return {
            isComplete: item.isComplete,
            label: item.label,
            isEditing: false
        };
    },
    getInitialState: function() {
        return this.buildState(this.props.item);
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState(this.buildState(nextProps.item));
    },
    handleToggle: function(evt) {
        Todo.toggle(this.props.item, evt.target.checked);
    },
    handleEdit: function(evt) {
        evt.preventDefault();
        this.setState({
            isEditing: true,
            editValue: this.state.label
        }, function() {
            this.refs.editInput.getDOMNode().focus();
        });        
    },
    handleValue: function(evt) {
        var text = this.state.editValue;

        if (!this.state.isEditing) {
            return;
        }

        if (isEnterKeyPressed(evt) && isNotEmpty(text)) {
            Todo.edit(this.props.item.key, this.state.editValue);
        }
        else if (isEscapeKeyPressed(evt)) {
            this.setState({
                isEditing: false
            });
        }
    },
    handleBlur: function() {
        if (this.state.isEditing) {
            Todo.edit(this.props.item.key, this.state.editValue);
        }
    },
    handleDestroy: function() {
        Todo.remove(this.props.item);
    },
    render: function() {
        var classes = React.addons.classSet({
            'completed': this.state.isComplete,
            'editing': this.state.isEditing
        });
        return (
            <li className={classes} onDoubleClick={this.handleEdit}>
                <div className="view">
                    <input className="toggle" type="checkbox" checked={this.state.isComplete} onChange={this.handleToggle} />
                    <label>{this.state.label}</label>
                    <button className="destroy" onClick={this.handleDestroy}></button>
                </div>
                <input ref="editInput" className="edit" valueLink={this.linkState('editValue')} onKeyUp={this.handleValue} onBlur={this.handleBlur} />
            </li>
        );
    }
});

var TodoList = React.createClass({
    getDefaultProps: function() {
        return {
            list: []
        };
    },
    asTodoItem: function(item) {
        return (
            <TodoItem item={item} key={item.key}/>
        );
    },
    render: function() {
        return (
            <ul id="todo-list">
                { this.props.list.map(this.asTodoItem) }
            </ul>
        );
    }
});

var TodoMain = React.createClass({
    getInitialState: function() {
        return {
            hide: false
        };
    },
    getDefaultProps: function() {
        return {
            list: []
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            hide: nextProps.list.length < 1
        });
    },
    toggleAll: function(evt) {
        Todo.toggleAll(evt.target.checked);
    },
    render: function() {
        var state = this.props.state;
        var filteredList;
        if (state === 'all') {
            filteredList = this.props.list;
        } else {
            filteredList = _.filter(this.props.list, function(item) {
                switch (state) {
                    case 'completed':
                        return item.isComplete;
                    case 'active':
                        return !item.isComplete;
                }
            });
        }
        var classes = React.addons.classSet({
            "hidden": this.state.hide
        })
        return (
            <section id="main" className={classes}>
                <input id="toggle-all" type="checkbox" onChange={this.toggleAll} />
                <label htmlFor="toggle-all">Mark all as complete</label>
                <TodoList list={filteredList} />
            </section>
        );
    }
});

var TodoHeader = React.createClass({
    addTodo: function(evt) {
        var text = evt.target.value;
        if (isEnterKeyPressed(evt) && isNotEmpty(text)) { // enter key pressed
            Todo.add(text);
            evt.target.value = '';
        }
    },
    render: function() {
        return (
            <header id="header">
                <h1>todos</h1>
                <input id="new-todo" placeholder="What needs to be done?" autoFocus onKeyUp={this.addTodo}/>
            </header>
        );
    }
});

var TodoFooter = React.createClass({
    getDefaultProps: function() {
        return {
            list: []
        };
    },
    getInitialState: function() {
        return {
            completedCount: 0,
            hideClearButton: false,
            isHidden: true
        };
    },
    componentWillReceiveProps: function(nextProps) {
        var all = nextProps.list.length;
        var complete = _.filter(nextProps.list, "isComplete").length;
        var incomplete = all - complete;
        this.setState({
            completedCount: complete,
            hideClearButton: complete < 1,
            count: incomplete,
            isHidden: all < 1
        });
    },
    clearCompleted: function() {
        Todo.clearCompleted();
    },
    render: function() {
        var completedLabel = "Clear completed (" + this.state.completedCount + ")",
            clearButtonClass = React.addons.classSet({hidden: this.state.hideClearButton}),
            hiddenClass = React.addons.classSet({hidden: this.state.isHidden});

        var itemsLeft = this.state.count > 1 ? " items left" : " item left";

        return (
            <footer id="footer" className={hiddenClass}>
                <span id="todo-count"><strong>{this.state.count}</strong>{itemsLeft}</span>
                <ul id="filters">
                    <li>
                        <ReactRouter.Link activeClassName="selected" to="All">All</ReactRouter.Link>
                    </li>
                    <li>
                        <ReactRouter.Link activeClassName="selected" to="Active">Active</ReactRouter.Link>
                    </li>
                    <li>
                        <ReactRouter.Link activeClassName="selected" to="Completed">Completed</ReactRouter.Link>
                    </li>
                </ul>
                <button id="clear-completed" className={clearButtonClass} onClick={this.clearCompleted}>{completedLabel}</button>
            </footer>
        );
    }
});

var TodoApp = React.createClass({
    mixins: [Reflux.ListenerMixin],
    getInitialState: function() {
        return {
            list: []
        };
    },
    componentDidMount: function() {
        this.listenTo(todoListStore, this.listChanged, this.listChanged);
    },
    listChanged: function(todoList) {
        this.setState({
            list: todoList
        });
    },
    render: function() {
        return (
            <div>
                <TodoHeader />
                <this.props.activeRouteHandler list={this.state.list} />
                <TodoFooter list={this.state.list} />
            </div>
        );
    }
});

var routes = (
    <ReactRouter.Routes location="hash">
        <ReactRouter.Route handler={TodoApp}>
            <ReactRouter.Route name="All" path="/" handler={TodoMain} state="all" />
            <ReactRouter.Route name="Completed" path="/completed" handler={TodoMain} state="completed" />
            <ReactRouter.Route name="Active" path="/active" handler={TodoMain} state="active" />
        </ReactRouter.Route>
    </ReactRouter.Routes>
);

React.renderComponent(routes, document.getElementById('todoapp'));
