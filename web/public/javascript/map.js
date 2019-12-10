var map = L.map('map').setView([46.0037, 8.9511], 15);
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmLayer = new L.TileLayer(osmUrl, {
    maxZoom: 19,
    attribution: 'Map data © OpenStreetMap contributors'
});
map.addLayer(osmLayer);
var markers = [];
var marker1 = L.marker([46.0037, 8.9511],{title:"marker_1"}).addTo(map).bindPopup("Marker 1");
markers.push(marker1);

marker1.on('mouseover',function(ev) {
    marker1.openPopup();
});


var circle = L.circle([46.0037, 8.9511], 500, {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5
}).addTo(map);


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
