var map = L.map('map').setView([46.0037, 8.9511], 15);
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmLayer = new L.TileLayer(osmUrl, {
    maxZoom: 19,
    attribution: 'Map data © OpenStreetMap contributors'
});
map.addLayer(osmLayer);
var markers = [];


function addMarker(lat, long, title) {
    var marker1 = L.marker([lat, long],{title: title}).addTo(map).bindPopup(title);

    marker1.on('mouseover',function(ev) {
        marker1.openPopup();
    });


    var circle = L.circle([lat, long], 50, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5
    }).addTo(map);

    markers.push(marker1);
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
    addMarker(46.0037+ l , 8.951 + l, "Bike " + i)
}
