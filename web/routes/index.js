var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/', function (req,res,next) {

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mp");
    var query = { address: "Park Lane 38" };
    dbo.collection("bikes").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      db.close();
    });
  });
})

module.exports = router;
