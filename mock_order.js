function generateOrder(){

    function makeArray(length){
        return new Array(length).toString().split(',');
    };

    function random(limit){
        return Math.round( Math.random() * limit );
    };

    return {
        order_was_made: false,
        order: mock_menu.map(function(day){

            var restaurant = random(2) === 2;
            var dishes = [];
            if ( !restaurant ) {
                dishes = makeArray( random(4) + 1 ).map(function(item){
                    return {
                        id: day.items[ random( day.items.length - 1 ) ].id,
                        count: random(2) + 1
                    };
                });
            }

            return {
                date: day.date,
                restaurant: restaurant,
                dishes: dishes
            };

        })
    };
};


var mock_order = {
    "order_was_made": false,
    "order": [
        {
            "date": "2013-03-03T20:00:00.000Z",
            "restaurant": false,
            "dishes": [
                {
                    "id": 79,
                    "count": 2
                },
                {
                    "id": 30,
                    "count": 2
                },
                {
                    "id": 88,
                    "count": 1
                },
                {
                    "id": 187,
                    "count": 3
                }
            ]
        },
        {
            "date": "2013-03-04T20:00:00.000Z",
            "restaurant": false,
            "dishes": [
                {
                    "id": 1132,
                    "count": 1
                },
                {
                    "id": 1177,
                    "count": 1
                },
                {
                    "id": 1068,
                    "count": 2
                }
            ]
        },
        {
            "date": "2013-03-05T20:00:00.000Z",
            "restaurant": false,
            "dishes": [
                {
                    "id": 2099,
                    "count": 2
                },
                {
                    "id": 2161,
                    "count": 2
                }
            ]
        },
        {
            "date": "2013-03-06T20:00:00.000Z",
            "restaurant": true,
            "dishes": []
        },
        {
            "date": "2013-03-07T20:00:00.000Z",
            "restaurant": false,
            "dishes": [
                {
                    "id": 4192,
                    "count": 1
                },
                {
                    "id": 4117,
                    "count": 2
                },
                {
                    "id": 4135,
                    "count": 2
                },
                {
                    "id": 4108,
                    "count": 2
                }
            ]
        }
    ]
};
