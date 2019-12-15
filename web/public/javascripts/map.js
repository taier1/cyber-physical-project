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
let currentCount = -1;

let hilightRow = function(bikeId){
    if(higlightedrow == null) {
        $('#row' + bikeId).css('background-color', 'yellow');
    }else if(higlightedrow === '#row' + bikeId){
        $(higlightedrow).css('background-color', '');
        higlightedrow = null;
        return;
    }else{
        $(higlightedrow).css('background-color', '');
        $('#row' + bikeId).css('background-color', 'yellow');
    }
    higlightedrow= '#row' + bikeId;
};

let addMarker = function(data, current, color) {
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

        marker1 = L.marker([lat, long], {icon: bikeIcon}, {title: bikeId});
        currentMarker.push(marker1);
        marker1.addTo(map).on('click', function(e) {
            hilightRow(bikeId)
        });
    } else {
        let pMarker = L.circle([lat, long], 5, {
            color: color,
            fillColor: color,
            fillOpacity: 0.1,
            weight:0
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

let updateAverage = function(){
    let totalAirQuality = 0;
    let totalPM10 = 0;
    let totalPM25 = 0;
    for (let key in dataMap) {
        totalAirQuality += dataMap[key]['airQuality'];
        totalPM10 += Number(dataMap[key]['pm10']);
        totalPM25 += Number(dataMap[key]['pm25']);
    }

    $('#tfoot').replaceWith('<tfoot id="tfoot" class="bg-light">' +
        '<tr><th>Average</th>' +
        '<th>'+ (totalAirQuality / Object.keys(dataMap).length).toFixed(2) +'</th>' +
        '<th>'+ (totalPM10 / Object.keys(dataMap).length).toFixed(2) +'</th>' +
        '<th>'+ (totalPM25 / Object.keys(dataMap).length).toFixed(2) +'</th></tr>' +
        '</tfoot>')
};


let updateTableRow = function (bikeObj) {
    if ($('#tbody').children().length === 0 || document.getElementById('row' + bikeObj["bikeId"]) === null) {
        $('#tbody').append('<tr id="row' + bikeObj["bikeId"] + '">' +
            '<th class="bikeId" data-id="'+ bikeObj["bikeId"] +' scope="row">' + bikeObj["bikeId"].slice(0, 5) + '...</th>' +
            '<td>' + Number(bikeObj["airQuality"]) + '</td>' +
            '<td>' + Number(bikeObj["pm10"]) + '</td>' +
            '<td>' + Number(bikeObj["pm25"]) + '</td>' +
            '</tr>')
    } else {
        $('#row' + bikeObj["bikeId"]).replaceWith('<tr id="row' + bikeObj["bikeId"] + '">' +
            '<th class="bikeId" data-id="'+ bikeObj["bikeId"] +' scope="row">' + bikeObj["bikeId"].slice(0, 5) + '</th>' +
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
        currentMarker.forEach(marker => map.removeLayer(marker));

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
        currentCount = data.length;

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
                        case (data[i]['pm25'] <= 12):
                            color = 'green';
                            break;
                        case (data[i]['pm25'] <= 36):
                            color = 'yellow';
                            break;
                        case (data[i]['pm25'] <= 56):
                            color = 'orange';
                            break;
                        case (data[i]['pm25'] <= 151):
                            color = 'red';
                            break;
                        case (data[i]['pm25'] <= 251):
                            color = 'purple';
                            break;
                        case (data[i]['pm25'] > 251):
                        color = 'bordeaux';
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
    }, 5000);
};


let handleBikeTableClick = function(document){
    $(document).on('click',".bikeId",function (e) {
        console.log($(e.target).attr('data-id'));
    });
};

$(document).ready(function () {
    addPreviousPositionsToMap();
    addCurrentPositionsToMap();
    mapSetup();
    timeout();

    handleBikeTableClick(document)
});
