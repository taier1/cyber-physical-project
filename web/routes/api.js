var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

const url = "mongodb://127.0.0.1:27017";
const dbName = "mindPollution";
const collectionName = "data";

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true
}

router.post('/update', function (req,res,next) {

  MongoClient.connect(url, options, function (err, db) {
    if (err) throw err;
    dbo.collection(collectionName).insertOne( req.body, function(error, record){
      if (error) throw error;
      console.log("data saved "   + JSON.stringify(req.body));
      res.sendStatus(200);
      db.close()
    });
  })
})

router.get('/getCurrentPositions', function (req,res,next) {
  MongoClient.connect(url, options, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    dbo.collection(collectionName).distinct('bikeId', function (err, bikeIds) {
      if (err) return callback(err);
      let results = [];
      for(let i = 0 ; i < bikeIds.length; i ++){
        let bikeId = bikeIds[i];
        dbo.collection(collectionName).find({"bikeId" : bikeId}).sort({createdAt:-1}).limit(1).toArray(function (err, result) {
          results.push(result[0]);
          if(results.length === bikeIds.length){
            res.json(results)
            db.close()
          }
        });
      }
    })
  });
})

router.get('/getPreviousPositions', function (req,res,next) {
  MongoClient.connect(url, options, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    dbo.collection(collectionName).find().sort({createdAt:-1}).toArray(function (err, result) {
      let cleanResult = result.splice(0,1);
      res.json(cleanResult)
      db.close()
    });
  });
})

module.exports = router;
