function generateMenu(){

    function makeArray(length){
        return new Array(length).toString().split(',');
    };

    function random(limit){
        return Math.round( Math.random() * limit );
    };

    var dishes = [
        'Каша молочная пшённая с тыквой',
        'Тефтели рыбные в томатном соусе + пюре',
        'Каша молочная рисовая',
        'Филе хека запеченое под маринадом + пюре',
        'Каша молочная геркулесовая',
        'Котлета "норвежская" из семги + рис с шафраном',
        'Каша молочная пшённая',
        'Филе трески жареное в яйце + рис'
    ];
    var categories = [
        'Первые блюда', 'Вторые блюда', 'Салаты', 'Пирожные', 'Прочее'
    ];
    var providers = [
        'Московский кейтеринг', 'Обеды-в-офис.ру'
    ];

    function getPreviousDay(day){
        return new Date( +day - 24 * 60 * 60 * 1000 );
    }

    function getTheNearestMonday(day){
        if ( day.getDay() === 1 ) {
            return day;
        }
        else {
            var dayBefore = getPreviousDay(day);
            return getTheNearestMonday(dayBefore);
        }
    }

    var monday = getTheNearestMonday(new Date());
    var date = monday.getDate();
    var month = monday.getMonth();
    var year = monday.getFullYear();

    return makeArray(5).map(function(dish, i){
        return {
            date: new Date(year, month, date + i).toISOString(),
            items: makeArray(200).map(function(item, j){
                return {
                    id: i * 1000 + ( j + 1 ),
                    name: dishes[ random( dishes.length -1 ) ],
                    price: random(150),
                    category: categories[ random( categories.length - 1 ) ],
                    provider: providers[ random( providers.length - 1 ) ]
                };
            })
        };
    });
}


if ( Meteor.isClient ) {
    window.generateMenu = generateMenu;
}

