const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, '..', '..', 'pollution_data', '*.csv');

const watcher = chokidar.watch( folderPath, {ignored: /^\./});


let monitor = function () {
    console.log("Starting watching folder: " + folderPath);
    watcher
        .on('add', function (path) {
            console.log('File', path, 'has been added');
        })
        .on('change', function (path) {
            console.log('File', path, 'has been changed');
        })
        .on('unlink', function (path) {
            console.log('File', path, 'has been removed');
        })
        .on('error', function (error) {
            console.error('Error happened', error);
        })
}

module.exports.start = monitor;
