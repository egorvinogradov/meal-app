
var Favourites = View.extend({

    initialize: function(){

        this.container = $(this.options.container);
        this.rawMenu = this.options.rawMenu;
        this.assembledMenu = this.options.assembledMenu;
        this.app = this.options.app;

        console.log('Favourites initialize');
        this.render( this.assembleFavourites(this.assembledMenu) );

    },
    assembleFavourites: function(assembledMenu){

        var categories = {};

        _.each(assembledMenu, function(day){
            _.each(day, function(provider){
                _.each(provider, function(dishes, categoryName){
                    if ( !categories[categoryName] ) {
                        categories[categoryName] = [];
                    }
                    categories[categoryName] = categories[categoryName].concat(dishes);
                });
            });
        });

        console.log('Favourites assembleFavourites', categories);
        return categories;
    },
    onItemClick: function(e){

        var item = $(e.currentTarget);
        var name = $.trim( item.text() );
        var provider = item.data('title');

        console.log('Selected favourite dish:', name, '(' + provider + ')');

    },
    onSaveButtonClick: function(){

        console.log('Saved favourites dishes');

    },
    onOrderButtonClick: function(){

        console.log('Ordered favourite dishes');

    },
    render: function(data){

        var fragment = Meteor.render($.proxy(function(){

            Template.header.events({
                'click .content__favourites-item': $.proxy(this.onItemClick, this),
                'click .content__favourites-save': $.proxy(this.onSaveButtonClick, this),
                'click .content__favourites-order': $.proxy(this.onOrderButtonClick, this)
            });

            return Template.favourites({
                categories: _.map(data, function(value, key){
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
        console.log('Favourites render', fragment, this.container);
        this.container.append(fragment);
        $('body').addClass('m-favourites');

    }
});
