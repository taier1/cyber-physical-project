var map = L.map('map').setView([46.0037, 8.9511], 15);
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmLayer = new L.TileLayer(osmUrl, {
    maxZoom: 19,
    attribution: 'Map data © OpenStreetMap contributors'
});
map.addLayer(osmLayer);
var markers = [];

var currentPosition = L.icon({
    iconUrl: '../images/bike.png',

    iconSize:     [46, 45], // size of the icon
    iconAnchor:   [23, 0], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

function addMarker(lat, long, title, current) {
    var marker1;

    if (current) 
        marker1 = L.marker([lat, long], {icon: currentPosition},{title: title}).addTo(map);
    // else 
    //     marker1 = L.marker([lat, long], {title: title}).addTo(map);

    // marker1.on('mouseover',function(ev) {
    //     marker1.openPopup();
    // });


    if (!current) {
        var circle = L.circle([lat, long], 50, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(map).bindPopup(title);

        markers.push(marker1);
    }
}



function markerFunction(id){
    for (var i in markers){
        var markerID = markers[i].options.title;
        if (markerID == id){
            markers[i].openPopup();
        };
    }
}

$("a").click(function(){
    markerFunction($(this)[0].id);
});

for (var i = 0; i < 20; i++){
    var l = 0.0001+i/1000;
    addMarker(46.0037+ l , 8.951 + l, "Bike " + i , false);
}
var l = 0.0001-10/1000;
addMarker(46.0037+ l , 8.951 + l, "Bike -20" , true);

