var markers = [];
var map;

let mapSetup = function () {
    map = L.map('map', {
        minZoom: 11
    }).setView([46.0037, 8.9511], 15);
    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmLayer = new L.TileLayer(osmUrl, {
        maxZoom: 19,
        attribution: 'Map data © OpenStreetMap contributors'
    });
    map.addLayer(osmLayer);
};

let addMarker = function(lat, long, title, current, color) {
    let marker1;

    if (current) {
        let bikeIcon = L.icon({
            iconUrl: '../images/bike.png',

            iconSize:     [map.getZoom()*0.5, map.getZoom()*0.5], // size of the icon
            iconAnchor:   [23, 0], // point of the icon which will correspond to marker's location
            popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });

        marker1 = L.marker([lat, long], {icon: bikeIcon},{title: title});
        marker1.addTo(map);

        map.on('zoomend', function() {
            let bikeIconZoom = L.icon({
                iconUrl: '../images/bike.png',

                iconSize:     [map.getZoom()*1.5, map.getZoom()*1.5], // size of the icon
                iconAnchor:   [23, 0], // point of the icon which will correspond to marker's location
                popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            });
            map.removeLayer(marker1);
            marker1 = L.marker([lat, long], {icon: bikeIconZoom},{title: title});
            marker1.addTo(map);
            // marker1.addTo(map);
        });
    }

    if (!current) {
        var circle = L.circle([lat, long], 50, {
            color: color,
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(map).bindPopup(title);

        markers.push(marker1);
    }
};

let _markerFunction = function(id){
    for (var i in markers){
        var markerID = markers[i].options.title;
        if (markerID == id){
            markers[i].openPopup();
        }
    }
};

$("a").click(function(){
    markerFunction($(this)[0].id);
});


let fakeData = function () {
    for (var i = 0; i < 20; i++){
        var l = 0.0001+i/1000;
        addMarker(46.0037+ l , 8.951 + l, "Bike " + i , false);
    }
}

let fetchCurrentPositions = function(next){
    $.ajax({
        url: "/api/getCurrentPositions",
        type: 'GET',
        dataType: 'json', // added data type
        success: function(res) {
            next(res)
        }
    });
}

$( document ).ready(function() {
    mapSetup();
    fetchCurrentPositions(function (data) {
        console.log(data)
        for(var i = 0 ; i < data.length; i ++){
            let long = data[i]['long'];
            let lat = data[i]['lat'];
            let bikeId = data[i]['bikeId'];
            addMarker(lat, long, bikeId , true)
        }
    })
})
