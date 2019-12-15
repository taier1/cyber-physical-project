var markers = {};
var map;
let dataMap = {};
let heatmapLayer;

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
            "PM 10: " + data["pm10"] + "<br>" +
            "PM 25: " + data["pm25"] );
        previousMarker.push(pMarker);
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
    addMarker(data, true);
};

let updateAverage = function(){
    let totalAirQuality = 0;
    let totalPM10 = 0;
    let totalPM25 = 0;
    for (let key in dataMap) {
        totalAirQuality += dataMap[key]['airQuality'];
        totalPM10 += dataMap[key]['pm10'];
        totalPM25 += dataMap[key]['pm25'];
    }

    $('#tfoot').replaceWith('<tfoot id="tfoot">' +
        '<tr><th>Average</th>' +
        '<th>'+totalAirQuality / Object.keys(dataMap).length+'</th>' +
        '<th>'+totalPM10 / Object.keys(dataMap).length+'</th>' +
        '<th>'+totalPM25 / Object.keys(dataMap).length+'</th></tr>' +
        '</tfoot>')
}


let updateTableRow = function (bikeObj) {
    if ($('#tbody').children().length === 0 || document.getElementById('row' + bikeObj["bikeId"]) === null) {
        $('#tbody').append('<tr id="row' + bikeObj["bikeId"] + '">' +
            '<th class="bikeId" data-id="'+ bikeObj["bikeId"] +'">' + bikeObj["bikeId"] + '</th>' +
            '<td>' + bikeObj["airQuality"] + '</td>' +
            '<td>' + bikeObj["pm10"] + '</td>' +
            '<td>' + bikeObj["pm25"] + '</td>' +
            '</tr>')
    } else {
        $('#row' + bikeObj["bikeId"]).replaceWith('<tr id="row' + bikeObj["bikeId"] + '">' +
            '<th class="bikeId" data-id="'+ bikeObj["bikeId"] +'">' + bikeObj["bikeId"] + '</th>' +
            '<td>' + bikeObj["airQuality"] + '</td>' +
            '<td>' + bikeObj["pm10"] + '</td>' +
            '<td>' + bikeObj["pm25"] + '</td>' +
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
        if (currentCount !== data.length)
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

        if (currentCount !== data.length) {
            currentMarker.forEach(marker => marker.addTo(map));
            currentCount = data.length;
        }
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

let addHeatMapPoints = function(dataArray){
    heatmapLayer.setData({'data': dataArray});
}

let heatMapSetup = function(){
    var cfg = {
        // radius should be small ONLY if scaleRadius is true (or small radius is intended)
        // if scaleRadius is false it will be the constant radius used in pixels
        "radius": 2,
        "maxOpacity": .8,
        // scales the radius based on map zoom
        "scaleRadius": true,
        // if set to false the heatmap uses the global maximum for colorization
        // if activated: uses the data maximum within the current map boundaries
        //   (there will always be a red spot with useLocalExtremas true)
        "useLocalExtrema": true,
        // which field name in your data represents the latitude - default "lat"
        latField: 'lat',
        // which field name in your data represents the longitude - default "lng"
        lngField: 'long',
        // which field name in your data represents the data value - default "value"
        valueField: 'airQuality'
    };


    heatmapLayer = new HeatmapOverlay(cfg);
    map.addLayer(heatmapLayer)
}

let timeout = function () {
    setTimeout(function () {
        addCurrentPositionsToMap();
        addPreviousPositionsToMap(false);
        timeout()
    }, 5000);
}

let handleBikeTableClick = function(document){
    $(document).on('click',".bikeId",function (e) {
        console.log($(e.target).attr('data-id'));
    });
}

mapSetup();
heatMapSetup()

$(document).ready(function () {
    addPreviousPositionsToMap();
    addCurrentPositionsToMap();
    timeout();
    handleBikeTableClick(document)
})
