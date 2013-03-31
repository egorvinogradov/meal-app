
/* Router */

if ( /favourites/i.test(location.href) ) { // TODO: use router
    this.favourites = new Favourites({
        app: this,
        container: '.content__wrapper',
        assembledMenu: assembledMenu,
        rawMenu: rawMenu
    });
}



