var markers = [];
var map;

var bikeIcon = L.icon({
    iconUrl: '../images/bike.png',

    iconSize: [46, 45], // size of the icon
    iconAnchor: [23, 0], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

let mapSetup = function () {
    map = L.map('map').setView([46.0037, 8.9511], 15);
    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmLayer = new L.TileLayer(osmUrl, {
        maxZoom: 19,
        attribution: 'Map data © OpenStreetMap contributors'
    });
    map.addLayer(osmLayer);
}

let addMarker = function (data, current) {
    let long = data['long'];
    let lat = data['lat'];
    let bikeId = data['bikeId'];


    var marker1;

    if (current)
        marker1 = L.marker([lat, long], {icon: bikeIcon}, {title: bikeId}).addTo(map);

    if (!current) {
        var circle = L.circle([lat, long], 50, {
            color: color,
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(map).bindPopup(title);

        markers.push(marker1);
    }
}

let _markerFunction = function (id) {
    for (var i in markers) {
        var markerID = markers[i].options.title;
        if (markerID == id) {
            markers[i].openPopup();
        }
        ;
    }
}

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

let updateBikeMarke = function (data) {
    let long = data['long'];
    let lat = data['lat'];
    let bikeId = data['bikeId'];
    addMarker(data, true)
}

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
}

let dataMap = {};
let updateMap = function (data, i) {
    dataMap[data[i]['bikeId']]['timestamp'] = data[i]['createdAt'];
    dataMap[data[i]['bikeId']]['pm10'] = data[i]['pm10'];
    dataMap[data[i]['bikeId']]['pm25'] = data[i]['pm25'];
    dataMap[data[i]['bikeId']]['airQuality'] = data[i]['airQuality'];
}
let addCurrentPositionsToMap = function () {
    fetchCurrentPositions(function (data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i]['bikeId'] in dataMap) {
                let latestTimeStamp = dataMap[data[i]['bikeId']]['timestamp']
                if (latestTimeStamp !== data[i]['createdAt']) {
                    updateMap(data, i)
                    updateTableRow(data[i])
                    updateBikeMarke(data[i])
                }
            } else {
                dataMap[data[i]['bikeId']] = {};
                updateMap(data, i)
                updateTableRow(data[i])
                updateBikeMarke(data[i])
            }

        }
    })
}

let addPreviousPositionsToMap = function () {
    fetchPreviousPositions(function (data) {
        for (var i = 0; i < data.length; i++) {
            let long = data[i]['long'];
            let lat = data[i]['lat'];
            let bikeId = data[i]['bikeId'];
            addMarker(lat, long, bikeId, false)
        }
    })
}

let timeout = function () {
    setTimeout(function () {
        addCurrentPositionsToMap()
        timeout()
    }, 1000);
}


mapSetup();
timeout()
