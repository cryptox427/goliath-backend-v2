const express = require('express');
// const con = require('./config/mySql');
const path = require('path');
var bodyParser = require('body-parser');
var app = require('express')();
const cors = require('cors');
const fs = require('fs');
const userRoute = require('./routes/api/user');
var http = require('http').createServer(app);
const PORT = 5000;

app.use(cors({
    origin: '*'
}));

// Connect Database
// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

// Init Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Define Routes
app.use('/api/collectionInfo', require('./routes/api/collectionInfo'));
app.use('/api/navInfo', require('./routes/api/nav'));
app.use('/api/user', userRoute);

http.listen(process.env.PORT || 5000, ()=> {
     console.log('listening on *:5000');
});
