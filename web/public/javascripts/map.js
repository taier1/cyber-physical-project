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

let previousMarker = [];
let currentMarker = [];
let currentCount = -1;

let addMarker = function(data, current, color, position) {
    let long = data['long'];
    let lat = data['lat'];
    let bikeId = data['bikeId'];
    let marker1;

    if (current) {
        let bikeIcon = L.icon({
            iconUrl: '../images/bike.png',
            iconSize:     [map.getZoom()*1.5, map.getZoom()*1.5], // size of the icon
            iconAnchor:   [23, 0], // point of the icon which will correspond to marker's location
            popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });

        marker1 = L.marker([lat, long], {icon: bikeIcon},{title: bikeId});
        currentMarker[position] = marker1;

        map.on('zoomend', function() {
            let bikeIconZoom = L.icon({
                iconUrl: '../images/bike.png',
                iconSize:     [map.getZoom()*1.5, map.getZoom()*1.5], // size of the icon
                iconAnchor:   [23, 0], // point of the icon which will correspond to marker's location
                popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
            });
            map.removeLayer(currentMarker[position]);
            marker1 = L.marker([lat, long], {icon: bikeIconZoom},{title: bikeId});
            currentMarker[position] = marker1;
            // marker1.addTo(map);
        });
    } else {
        let pMarker = L.circle([lat, long], 50, {
            color: color,
            fillColor: color,
            fillOpacity: 0.5
        }).addTo(map).bindPopup(bikeId);
        previousMarker.push(pMarker);
    }
};

let _markerFunction = function (id) {
    for (var i in markers) {
        var markerID = markers[i].options.title;
        if (markerID == id) {
            markers[i].openPopup();
        }
    }
};

$("a").click(function () {
    markerFunction($(this)[0].id);
});

let fetchCurrentPositions = function (next) {
    $.ajax({
        url: "/api/getCurrentPositions",
        type: 'GET',
        dataType: 'json', // added data type
        success: function (res) {
            next(res)
        }
    });
};

let fetchPreviousPositions = function (next) {
    $.ajax({
        url: "/api/getPreviousPositions",
        type: 'GET',
        dataType: 'json', // added data type
        success: function (res) {
            next(res)
        }
    });
};

let updateBikeMarker = function (data, position) {
    addMarker(data, true, null, position);
};

let updateTableRow = function (bikeObj) {
    if ($('#tbody').children().length === 0 || document.getElementById('row' + bikeObj["bikeId"]) === null) {
        $('#tbody').append('<tr id="row' + bikeObj["bikeId"] + '">' +
            '<th>' + bikeObj["bikeId"] + '</th>' +
            '<td>' + bikeObj["airQuality"] + '</td>' +
            '<td>' + bikeObj["pm10"] + '</td>' +
            '<td>' + bikeObj["pm25"] + '</td>' +
            '</tr>')
    } else {
        $('#row' + bikeObj["bikeId"]).replaceWith('<tr id="row' + bikeObj["bikeId"] + '">' +
            '<th>' + bikeObj["bikeId"] + '</th>' +
            '<td>' + bikeObj["airQuality"] + '</td>' +
            '<td>' + bikeObj["pm10"] + '</td>' +
            '<td>' + bikeObj["pm25"] + '</td>' +
            '</tr>'
        )
    }

    var $elements = $('#row' + bikeObj["bikeId"]).addClass('highlight');
    setTimeout(function () {
        $elements.removeClass('highlight')
    }, 4000);
};

let dataMap = {};

let updateMap = function (data, i) {
    dataMap[data[i]['bikeId']]['timestamp'] = data[i]['createdAt'];
    dataMap[data[i]['bikeId']]['pm10'] = data[i]['pm10'];
    dataMap[data[i]['bikeId']]['pm25'] = data[i]['pm25'];
    dataMap[data[i]['bikeId']]['airQuality'] = data[i]['airQuality'];
};

let addCurrentPositionsToMap = function () {
    fetchCurrentPositions(function (data) {
        if (currentCount !== data.length)
            currentMarker.forEach(marker => map.removeLayer(marker));
            currentCount = data.length;

        for (var i = 0; i < data.length; i++) {
            if (data[i]['bikeId'] in dataMap) {
                let latestTimeStamp = dataMap[data[i]['bikeId']]['timestamp'];
                if (latestTimeStamp !== data[i]['createdAt']) {
                    updateMap(data, i);
                    updateTableRow(data[i]);
                    updateBikeMarker(data[i], i)
                }
            } else {
                dataMap[data[i]['bikeId']] = {};
                updateMap(data, i);
                updateTableRow(data[i]);
                updateBikeMarker(data[i], i)
            }
        }

        currentMarker.forEach(marker => marker.addTo(map));

    })
};

let addPreviousPositionsToMap = function () {
    fetchPreviousPositions(function (data) {
        previousMarker.forEach(marker => map.removeLayer(marker));
        previousCount = data.length;

        for (var i = 0; i < data.length; i++) {
            if (data[i]['bikeId'] in dataMap) {
                for (var i = 0; i < data.length; i++) {
                    let color = 'red';
                    switch (true) {
                        case (data[i]['airQuality'] <= 0.1):
                            color = 'green';
                            break;
                        case (data[i]['airQuality'] <= 0.3):
                            color = 'yellow';
                            break;
                        case (data[i]['airQuality'] > 0.3):
                            color = 'red';
                            break;
                    }
                    addMarker(data[i], false, color)
                }
            }
        }
    })
};

let timeout = function () {
    setTimeout(function () {
        addCurrentPositionsToMap();
        addPreviousPositionsToMap();
        timeout()
    }, 1000);
};


mapSetup();
timeout();

