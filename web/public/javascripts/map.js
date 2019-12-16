var markers = {};
var map;
let dataMap = {};


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
let higlightedrow = null;

let markerMap = {}

let hilightRow = function (bikeId) {
    if (higlightedrow == null) {
        $('#row' + bikeId).css('background-color', 'yellow');
    } else if (higlightedrow === '#row' + bikeId) {
        $(higlightedrow).css('background-color', '');
        higlightedrow = null;
        return;
    } else {
        $(higlightedrow).css('background-color', '');
        $('#row' + bikeId).css('background-color', 'yellow');
    }
    higlightedrow = '#row' + bikeId;
};

let addMarker = function (data, current, color) {
    let long = data['long'];
    let lat = data['lat'];
    let bikeId = data['bikeId'];
    let marker1;

    if (current) {
        let bikeIcon = L.icon({
            iconUrl: '../images/bike.png',
            iconSize: [map.getZoom() * 1.5, map.getZoom() * 1.5], // size of the icon
            iconAnchor: [23, 0], // point of the icon which will correspond to marker's location
            popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
        });


        marker1 = L.marker([lat, long], {icon: bikeIcon}, {title: bikeId});
        currentMarker.push(marker1);

        marker1.addTo(map).on('click', function (e) {
            hilightRow(bikeId)
        });

        if (bikeId in markerMap) {
            map.removeLayer(markerMap[bikeId]);
            markerMap[bikeId] = marker1
        } else {
            markerMap[bikeId] = marker1
        }
    } else {
        let pMarker = L.circle([lat, long], 5, {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            weight: 0
        }).addTo(map).bindPopup("Air Quality: " + data["airQuality"] + "<br>" +
            "PM 10: " + Number(data["pm10"]) + "<br>" +
            "PM 25: " + Number(data["pm25"]));
        previousMarker.push(pMarker);
    }
};

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
    addMarker(data, true);
};

let updateAverage = function () {
    let totalAirQuality = 0;
    let totalPM10 = 0;
    let totalPM25 = 0;
    for (let key in dataMap) {
        totalAirQuality += Number(dataMap[key]['airQuality']);
        totalPM10 += Number(dataMap[key]['pm10']);
        totalPM25 += Number(dataMap[key]['pm25']);
    }

    $('#tfoot').replaceWith('<tfoot id="tfoot" class="bg-light">' +
        '<tr><th>Average</th>' +
        '<th>' + (totalAirQuality / Object.keys(dataMap).length).toFixed(2) + '</th>' +
        '<th>' + (totalPM10 / Object.keys(dataMap).length).toFixed(2) + '</th>' +
        '<th>' + (totalPM25 / Object.keys(dataMap).length).toFixed(2) + '</th></tr>' +
        '</tfoot>')
};


let updateTableRow = function (bikeObj) {
    if ($('#tbody').children().length === 0 || document.getElementById('row' + bikeObj["bikeId"]) === null) {
        $('#tbody').append('<tr id="row' + bikeObj["bikeId"] + '">' +
            '<th class="bikeId" data-id="' + bikeObj["bikeId"] + ' scope="row">' + bikeObj["bikeId"].slice(0, 5) + '...</th>' +
            '<td>' + Number(bikeObj["airQuality"]) + '</td>' +
            '<td>' + Number(bikeObj["pm10"]) + '</td>' +
            '<td>' + Number(bikeObj["pm25"]) + '</td>' +
            '</tr>')
    } else {
        $('#row' + bikeObj["bikeId"]).replaceWith('<tr id="row' + bikeObj["bikeId"] + '">' +
            '<th class="bikeId" data-id="' + bikeObj["bikeId"] + ' scope="row">' + bikeObj["bikeId"].slice(0, 5) + '</th>' +
            '<td>' + Number(bikeObj["airQuality"]) + '</td>' +
            '<td>' + Number(bikeObj["pm10"]) + '</td>' +
            '<td>' + Number(bikeObj["pm25"]) + '</td>' +
            '</tr>'
        )
    }

    updateAverage();

    var $elements = $('#row' + bikeObj["bikeId"]).addClass('highlight');
    setTimeout(function () {
        $elements.removeClass('highlight')
    }, 4000);
};

let updateMap = function (data, i) {
    dataMap[data[i]['bikeId']]['timestamp'] = data[i]['createdAt'];
    dataMap[data[i]['bikeId']]['pm10'] = data[i]['pm10'];
    dataMap[data[i]['bikeId']]['pm25'] = data[i]['pm25'];
    dataMap[data[i]['bikeId']]['airQuality'] = data[i]['airQuality'];
};

let addCurrentPositionsToMap = function () {
    fetchCurrentPositions(function (data) {
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

    })
};

let addPreviousPositionsToMap = function () {
    fetchPreviousPositions(function (data) {
        previousMarker.forEach(marker => map.removeLayer(marker));
        let currentSensor = $("#sensor").val();

        for (var i = 0; i < data.length; i++) {
            if (data[i]['bikeId'] in dataMap) {
                for (var i = 0; i < data.length; i++) {
                    let color = 'red';
                    if (currentSensor === "pm10") {
                        switch (true) {
                            case (data[i][currentSensor] <= 50):
                                color = 'green';
                                break;
                            case (data[i][currentSensor] <= 100):
                                color = '#66ff33';
                                break;
                            case (data[i][currentSensor] <= 250):
                                color = 'yellow';
                                break;
                            case (data[i][currentSensor] <= 350):
                                color = 'orange';
                                break;
                            case (data[i][currentSensor] <= 430):
                                color = 'red';
                                break;
                            case (data[i][currentSensor] > 430):
                                color = 'bordeaux';
                                break;
                        }
                    } else if (currentSensor === "pm25") {
                        switch (true) {
                            case (data[i][currentSensor] <= 30):
                                color = 'green';
                                break;
                            case (data[i][currentSensor] <= 60):
                                color = '#66ff33';
                                break;
                            case (data[i][currentSensor] <= 90):
                                color = 'yellow';
                                break;
                            case (data[i][currentSensor] <= 120):
                                color = 'orange';
                                break;
                            case (data[i][currentSensor] <= 250):
                                color = 'red';
                                break;
                            case (data[i][currentSensor] > 250):
                                color = 'bordeaux';
                                break;
                        }
                    } else {
                        switch (true) {
                            case (data[i][currentSensor] <= 150):
                                color = 'green';
                                break;
                            case (data[i][currentSensor] <= 300):
                                color = '#ff9933';
                                break;
                            case (data[i][currentSensor] > 300):
                                color = 'red';
                                break;
                        }
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
    }, 5000);
};


let handleBikeTableClick = function (document) {
    $(document).on('click', ".bikeId", function (e) {
        console.log($(e.target).attr('data-id'));
    });
};

let mapLegend = {
    'pm25': {
        'Good': 'green',
        'Satisfactory': '#66ff33',
        'Moderately polluted': 'yellow',
        'Poor': 'orange',
        'Very poor': 'red',
        'Severe': 'maroon'
    },
    'pm10': {
        'Good': 'green',
        'Satisfactory': '#66ff33',
        'Moderately polluted': 'yellow',
        'Poor': 'orange',
        'Very poor': 'red',
        'Severe': 'maroon'
    },
    'airQuality': {
        'Good' : 'green',
        'Moderate' : '#ff9933',
        'Poor' : 'red'
    }
};

let legendSetup = function () {
    let currentSensor = $("#sensor").val();
    dictionary = mapLegend[currentSensor];
    Object.keys(dictionary).forEach(function(key) {
        $('#legend').append('<div style="display: inline-flex; margin-right: 30px;"><div class="circle" style="background-color: '+ dictionary[key] +'"/><div style="display: -webkit-inline-box;"> '+ key +'</div></div>')
    });
};

$("#sensor").on("change", function () {
    $('#legend').empty();
    legendSetup();
    addCurrentPositionsToMap();
    addPreviousPositionsToMap();
});

$(document).ready(function () {
    mapSetup();
    legendSetup();
    addPreviousPositionsToMap();
    addCurrentPositionsToMap();
    timeout();

    handleBikeTableClick(document)
});
