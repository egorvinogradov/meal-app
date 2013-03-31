function View(){
    /** @constructor */
};

View.extend = function(methods){
    
    var BaseView = function(options){
        if ( options ) {
            this.options = options;
        }
        this.initialize && this.initialize();
    };
    for ( var key in this.prototype ) {
        BaseView.prototype[key] = this.prototype[key];
    }
    for ( var method in methods ) {
        BaseView.prototype[method] = methods[method];
    }
    BaseView.extend = this.extend;
    return BaseView;
};


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
        'Суббота',
        'Воскресенье'
    ],
    messageEndingsWeek: 'всю неделю',
    messageEndingsWeekdays: {
        'понедельник':  'по понедельникам',
        'вторник':      'по вторникам',
        'среда':        'по средам',
        'четверг':      'по четвергам',
        'пятница':      'по пятницам',
        'суббота':      'по субботам',
        'воскресенье':  'по воскресеньям'
    },
    messageBeginnings: {
        restaurant: 'Ресторан ',
        weightLoss: 'Худею '
    },
    order: {
        classes: {
            restaurant: 'content__order-restaurant',
            weightLoss: 'content__order-weightloss'
        }
    },
    overlay: {
        classes: {
            restaurant: {
                day: 'm-overlay-day-restaurant',
                week: 'm-overlay-week-restaurant'
            },
            weightLoss: {
                day: 'm-overlay-day-weightloss',
                week: 'm-overlay-week-weightloss'
            }
        },
        links: {
            restaurant: {
                text: 'Где это клёвое место?',
                href: 'http://maps.google.com' // TODO: указать точное место
            },
            weightLoss: {
                text: 'Худейте правильно',
                href: 'http://ru.wikipedia.org' // TODO: какая-нибудь статья о диете
            }
        }
    }
};


var App = View.extend({

    selectors: {
        overlay: '.content__overlay'
    },

    initialize: function(){

        console.log('App initialize');
        this.config = this.options.config;

        var order = this.getOrder();
        var rawMenu = this.getMenu();
        var assembledMenu = this.assembleMenu(rawMenu);

        this.header = new Header({
            app: this,
            container: '.header',
            assembledMenu: assembledMenu,
            rawMenu: rawMenu,
            order: order
        });

        if ( /order/i.test(location.href) ) { // TODO: use router
            this.order = new Order({
                container: '.content__wrapper',
                order: order,
                app: this
            });
        }
        else {
            this.menu = new Menu({
                app: this,
                container: '.content__wrapper',
                assembledMenu: assembledMenu,
                rawMenu: rawMenu
            });
        }

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

    },
    removeOverlays: function(){
        $(this.selectors.overlay).remove();
    }

});



var Header = View.extend({

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

        this.container = $(this.options.container);
        this.app = this.options.app;
        this.order = this.options.order;
        this.rawMenu = this.options.rawMenu;
        this.assembledMenu = this.options.assembledMenu;

        console.log('Header initialize', this.rawMenu);

        this.render(this.rawMenu, this.order);
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
            this.app.menu.assembledMenu,
            currentDate,
            currentProvider
        );
    },
    onHeaderDayClick: function(e){
        this.hideSelects();
        $(e.currentTarget).addClass(this.classes.opened);
    },
    onSelectItemClick: function(e){

        this.app.removeOverlays();
        this.hideSelects();

        var currentTarget = $(e.currentTarget);
        var currentDay = currentTarget.parents(this.selectors.headerDay).first();
        var weekday = currentDay.data('weekday');
        var type = currentTarget.data('value');

        currentTarget
            .addClass(this.classes.active)
            .siblings()
            .removeClass(this.classes.active);

        if ( type === 'office' ) {

            var currentDate = currentTarget.parents(this.selectors.headerDay).data('date');
            var currentProvider = this.app.menu.container.data('provider');

            this.updateProviders(this.rawMenu, currentDate, currentProvider);
            this.app.menu.render(this.assembledMenu, currentDate, currentProvider);
        }
        else if ( type === 'restaurant' ) {
            var overlay = new Overlay({
                container: '.content',
                type: 'restaurant',
                weekday: weekday,
                app: this.app
            });
        }
        else if ( type === 'weightLoss' ) {
            var overlay = new Overlay({
                container: '.content',
                type: 'weightLoss',
                weekday: weekday,
                app: this.app
            });
        }

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
            if ( e.which === 27 /* ESC */ ) {
                this.hideSelects();
            }
        }, this));
    }

});



var Menu = View.extend({

    initialize: function(){

        this.container = $(this.options.container);
        this.rawMenu = this.options.rawMenu;
        this.assembledMenu = this.options.assembledMenu;
        this.app = this.options.app;

        console.log('Menu initialize', this.assembledMenu);

        var firstDay = _.keys(this.assembledMenu)[0];
        var firstProvider = _.keys(this.assembledMenu[firstDay])[0];

        this.render(this.assembledMenu, firstDay, firstProvider);
        this.app.header.updateProviders(this.rawMenu, firstDay, firstProvider);

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
        });
    }
});



var Overlay = View.extend({

    initialize: function(){

        this.container = $(this.options.container);
        this.app = this.options.app;
        this.type = this.options.type;
        this.weekday = this.options.weekday;

        var config = this.app.config;
        var templateVars = {
            link: config.overlay.links[this.type],
            className: config.overlay.classes[this.type][ this.weekday ? 'day' : 'week' ],
            message: config.messageBeginnings[this.type] + (
                this.weekday
                    ? config.messageEndingsWeekdays[this.weekday.toLowerCase()]
                    : config.messageEndingsWeek
            )
        }

        console.log('Overlay initialize', this.type, templateVars);
        this.render(templateVars);
    },

    render: function(data){
        var fragment = Meteor.render($.proxy(function(){
            return Template.overlay(data);
        }, this));
        console.log('Overlay render', fragment, this.container);
        this.container.append(fragment);
    }
});


var Order = View.extend({

    initialize: function(){

        this.container = $(this.options.container);
        this.order = this.options.order;
        this.app = this.options.app;

        console.log('Order initialize');

        this.render(this.order);

    },

    render: function(data){

        var config = this.app.config;
        var fragment = Meteor.render($.proxy(function(){
            return Template.order({
                days: _.map(data.order, function(dayOrder){

                    var day = this.app.getDayByDate(dayOrder.date);

                    if ( dayOrder.dishes && dayOrder.dishes.length ) {
                        return {
                            date: dayOrder.date,
                            dishes: dayOrder.dishes,
                            day: day,
                            price: 300
                        }
                    }
                    else if ( dayOrder.restaurant ) {
                        return {
                            date: dayOrder.date,
                            day: day,
                            message: config.messageBeginnings.restaurant + config.messageEndingsWeekdays[day.toLowerCase()],
                            className: config.order.classes.restaurant
                        }
                    }
                    else {
                        return {
                            date: dayOrder.date,
                            day: day,
                            message: config.messageBeginnings.weightLoss + config.messageEndingsWeekdays[day.toLowerCase()],
                            className: config.order.classes.weightLoss
                        }
                    }

                }, this)
            });
        }, this));
        console.log('Order render', fragment, this.container);
        this.container.append(fragment);
        $('body').addClass('m-order');

    }
});






if ( Meteor.isClient ) {

    // TODO: remove
    function init(){
        if ( typeof mock_menu === 'undefined' || typeof mock_order === 'undefined' ) {
            setTimeout(init, 100);
        }
        else {
            window.app = new App({ config: Config });
        }
    };

    init();

}
