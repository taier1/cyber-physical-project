var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

const url = "mongodb://localhost:27017/";
const dbName = "mindPollution";
const collectionName = "data";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

router.post('/update', function (req,res,next) {

  MongoClient.connect(url, options, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    dbo.collection(collectionName).insertOne( req.body, function(error, record){
      if (error) throw error;
      console.log("data saved "   + JSON.stringify(req.body));
      res.sendStatus(200);
      db.close()
    });
  })
})

router.get('/update', function (req,res,next) {
  MongoClient.connect(url, options, function (err, db) {
    if (err) throw err;
    var dbo = db.db(dbName);
    dbo.collection(collectionName).find({}).sort({createdAt: -1}).limit(100).toArray(function (err, result) {
      if (err) throw err;
      res.json(result);
      db.close();
    });
  });
})

module.exports = router;
