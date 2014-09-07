/** @jsx React.DOM */

function isEnterKeyPressed(evt) {
    return evt.nativeEvent.keyCode === 13;
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
        this.setState({
            isEditing: true,
            editValue: this.state.label
        });
        return false;
    },
    handleValue: function(evt) {
        var text = this.state.editValue;
        if (isEnterKeyPressed(evt) && isNotEmpty(text)) {
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
                <input className="edit" valueLink={this.linkState('editValue') } onKeyUp={this.handleValue} />
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
        return (
            <section id="main" className={this.state.hide ? "hidden" : ""}>
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
            clearButtonClass = this.state.hideClearButton ? "hidden" : "";
        return (
            <footer id="footer" className={this.state.isHidden ? "hidden" : ""}>
                <span id="todo-count"><strong>{this.state.count}</strong>{ this.state.count > 1 ? " items left" : " item left"}</span>
                <ul id="filters">
                    <li>
                        <ReactRouter.Link activeClassName="selected" to="/">All</ReactRouter.Link>
                    </li>
                    <li>
                        <ReactRouter.Link activeClassName="selected" to="/active">Active</ReactRouter.Link>
                    </li>
                    <li>
                        <ReactRouter.Link activeClassName="selected" to="/completed">Completed</ReactRouter.Link>
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
            <ReactRouter.Route path="/" handler={TodoMain} state="all" />
            <ReactRouter.Route path="/completed" handler={TodoMain} state="completed" />
            <ReactRouter.Route path="/active" handler={TodoMain} state="active" />
        </ReactRouter.Route>
    </ReactRouter.Routes>
);

React.renderComponent(routes, document.getElementById('todoapp'));
