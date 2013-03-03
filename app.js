// function View(proto){
//     var f = function(){};
//     f.prototype = proto;
//     return f;
// };

var Config = {
    categories: [
        'Первые блюда',
        'Вторые блюда',
        'Салаты',
        'Пирожные',
        'Прочее'
    ],
    weekdays: [
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота'
    ]
};

function App(config){
    /** @constructor */
    this.config = config;
};

App.prototype = {

    initialize: function(){

        console.log('App initialize');

        var order = this.getOrder();
        var menu = this.getMenu();
        var assembledMenu = this.assembleMenu(menu);

        this.header = new Header({
            container: '.header',
            menu: {
                raw: menu,
                assembled: assembledMenu
            },
            order: order,
            app: this
        });
        this.header.initialize();

        this.menu = new Menu({
            container: '.content__wrapper',
            menu: {
                raw: menu,
                assembled: assembledMenu
            },
            app: this
        });
        this.menu.initialize();

    },
    getMenu: function(){

        return mock_menu; // TODO: replace

    },
    getOrder: function(){

        return mock_order; // TODO: replace

    },
    getDayByDate: function(dateStr){
        var dayCode = new Date(dateStr).getDay();
        var days = this.config.weekdays;
        return dayCode === 0
            ? days[ days.length - 1 ]
            : days[ dayCode - 1 ];
    },
    getMenuByDate: function(menu, date){
        return _.find(menu, function(day, i){
            return new Date(day.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0];
        }, this);
    },
    getOrderByDate: function(order, date){
        return _.find(order.order, function(day, i){
            return new Date(day.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0];
        }, this);
    },
    getDayOrderPrice: function(menu, dayOrder){
        var price = 0;
        _.each(dayOrder.dishes, function(orderDish){
            var dish = this.getDishById(menu, orderDish.id);
            if ( dish && dish.price ) {
                price += dish.price;
            }
        }, this);
        return price;
    },
    getDishById: function(menu, id){
        for ( var i = 0, l = menu.length; i < l; i++ ) {
            var items = menu[i].items;
            for ( var j = 0, k = items.length; j < k; j++ ) {
                var item = items[j];
                if ( item.id == id ) {
                    return item;
                }
            }
        }
    },
    assembleMenu: function(menu){

        var assembledMenu = {};

        _.each(menu, function(day){

            var providers = {};

            _.each(day.items, function(item){
                var provider = providers[item.provider];
                if ( !provider ) {
                    providers[item.provider] = {};
                }
                var category = providers[item.provider][item.category];
                if ( !category ) {
                    providers[item.provider][item.category] = [];
                }
                providers[item.provider][item.category].push(item);
            }, this);

            assembledMenu[day.date] = providers;

        }, this);

        return assembledMenu;

    }
};



///////////////////////



function Header(options){
    /** @constructor */
    this.container = $(options.container);
    this.app = options.app;
    this.menu = options.menu;
    this.order = options.order;
};


Header.prototype = {

    selectors: {
        headerDay: '.header__day',
        selectItem: '.header__day-select-item',
        provider: '.header__provider',
        providerList: '.header__providers-list'
    },
    classes: {
        active: 'm-active',
        opened: 'm-opened'
    },
    initialize: function(){

        console.log('Header initialize', this.menu.raw);
        this.render(this.menu.raw, this.order);
        this.bindBodyEvents();
    },
    getCurrentWeekDays: function(menu){

        function getPreviousDay(day){
            return new Date( +day - 24 * 60 * 60 * 1000 );
        };
        function getNextDay(day){
            return new Date( +day + 24 * 60 * 60 * 1000 );
        };

        function getNearestMonday(day){
            if ( day.getDay() === 1 ) {
                return day;
            }
            else {
                var dayDefore = getPreviousDay(firstDay);
                getNearestMonday(dayDefore);
            }
        }

        var firstDay = new Date(menu[0].date);
        var monday = getNearestMonday(firstDay);
        var weekdays = [];
        var currentDay = monday;

        for ( var i = 0; i < 7; i++ ) {
            weekdays.push(currentDay.toISOString());
            currentDay = getNextDay(currentDay);
        }

        return weekdays;
    },
    assembleMenuDays: function(menu, order){

        var days = _.map(this.getCurrentWeekDays(menu), function(date){
            var dayOrder = this.app.getOrderByDate(order, date);
            var dayOrderPrice = dayOrder && this.app.getDayOrderPrice(menu, dayOrder);
            return {
                price: dayOrderPrice,
                weekday: this.app.getDayByDate(date),
                hasPrice: dayOrderPrice && dayOrderPrice > 0 ? true : false,
                completed: dayOrder && ( dayOrder.dishes.length || dayOrder.restaurant ),
                inactive: this.app.getMenuByDate(menu, date) ? false : true,
                isRestaurant: dayOrder && dayOrder.restaurant,
                isOffice: dayOrder && dayOrder.dishes.length && !dayOrder.restaurant,
                isNone: dayOrder && !dayOrder.dishes.length && !dayOrder.restaurant,
                date: date
            };
        }, this);

        console.log('Header assembleMenuDays', days);
        return days;

    },
    assembleMenuProviders: function(menu){

        var providers = {};
        _.each(menu, function(day){
            _.each(day.items, function(item){
                if ( !providers[item.provider] ) {
                    providers[item.provider] = true;
                }
            }, this);
        }, this);
        providers = _.map(providers, function(value, key){
            return { name: key };
        }, this);

        console.log('Header assembleMenuProviders', providers);
        return providers;
    },
    onProviderClick: function(e){

        var target = $(e.currentTarget);
        var currentProvider = target.data('name');
        var currentDate = this.app.menu.container.data('date');

        target
            .addClass(this.classes.active)
            .siblings()
            .removeClass(this.classes.active);

        this.app.menu.render(
            this.app.menu.menu.assembled,
            currentDate,
            currentProvider
        );
    },
    onHeaderDayClick: function(e){
        this.hideSelects();
        $(e.currentTarget).addClass(this.classes.opened);
    },
    onSelectItemClick: function(e){

        var currentTarget = $(e.currentTarget);
        var type = currentTarget.data('value');

        currentTarget
            .addClass(this.classes.active)
            .siblings()
            .removeClass(this.classes.active);

        if ( type === 'office' ) {

            var currentDate = currentTarget.parents(this.selectors.headerDay).data('date');
            var currentProvider = this.app.menu.container.data('provider');

            this.updateProviders(this.menu.raw, currentDate, currentProvider);
            this.app.menu.render(this.menu.assembled, currentDate, currentProvider);
        }
        else if ( type === 'restaurant' ) {
            console.log('>>> render overlay restaurant'); // TODO: render overlay
        }
        else if ( type === 'none' ) {
            console.log('>>> render overlay none');  // TODO: render overlay
        }

        this.hideSelects();
        e.stopPropagation();
    },
    updateProviders: function(menu, date, selectedProvider){

        var fragment = Meteor.render($.proxy(function(){
            Template.headerProviders.events({
                'click .header__provider': $.proxy(this.onProviderClick, this)
            });
            return Template.headerProviders({
                providers: this.assembleMenuProviders(menu)
            });
        }, this));

        console.log('Header updateProviders', date, menu);
        $(this.selectors.providerList, this.container).html(fragment);
        $(this.selectors.provider, this.container)
            .filter('[data-name="' + selectedProvider + '"]')
            .addClass(this.classes.active);

    },
    render: function(menu, order){

        var fragment = Meteor.render($.proxy(function(){
            Template.header.events({
                'click .header__day': $.proxy(this.onHeaderDayClick, this),
                'click .header__day-select-item': $.proxy(this.onSelectItemClick, this)
            });
            return Template.header({
                days: this.assembleMenuDays(menu, order)
            });
        }, this));

        console.log('Header render', fragment);
        this.container.html(fragment);

    },
    hideSelects: function(){
        $(this.selectors.headerDay, this.container).removeClass(this.classes.opened);
    },
    bindBodyEvents: function(){

        $('body').on('click', $.proxy(function(e){
            var target = $(e.target);
            if ( !target.is(this.selectors.headerDay) && !target.parents().is(this.selectors.headerDay) ) {
                this.hideSelects();
            }
        }, this)).on('keyup', $.proxy(function(e){
            if ( e.which === 27 ) {
                this.hideSelects();
            }
        }, this));
    },
};


//////////////////////////



function Menu(options){
    /** @constructor */
    this.container = $(options.container);
    this.app = options.app;
    this.menu = options.menu;
}

Menu.prototype = {

    initialize: function(){

        console.log('Menu initialize', this.menu.assembled);

        var firstDay = _.keys(this.menu.assembled)[0];
        var firstProvider = _.keys(this.menu.assembled[firstDay])[0];
        this.render(this.menu.assembled, firstDay, firstProvider);
        this.app.header.updateProviders(this.menu.raw, firstDay, firstProvider);

    },
    render: function(menu, date, provider){

        var fragment = Meteor.render($.proxy(function(){
            return Template.menu({
                categories: _.map(menu[date][provider], function(value, key){
                    return {
                        name: key,
                        items: value
                    };
                }, this).sort($.proxy(function(a,b){
                    var categories = this.app.config.categories;
                    return categories.indexOf(a.name) < categories.indexOf(b.name) ? -1 : 1;
                }, this))
            });
        }, this));
        console.log('Menu render', fragment);
        this.container.html(fragment).data({
            date: date,
            provider: provider
        })
    }
};


if ( Meteor.isClient ) {

    // TODO: remove
    function init(){
        if ( typeof mock_menu === 'undefined' || typeof mock_order === 'undefined' ) {
            setTimeout(init, 100);
        }
        else {
            window.app = new App(Config);
            window.app.initialize();
        }
    };

    init();

}
