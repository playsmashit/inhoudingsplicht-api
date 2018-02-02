#!/usr/bin/env node

process.on("warning", e => console.warn(e.stack));

const retainmentApi = require('./retainment.api')

var fs = require('fs');
var path = require('path');

var express = require('express');
var path = require('path');
var morganLogger = require('morgan');
var bodyParser = require('body-parser');
var utils = require('./utils');

var app = express();

app.set('port', process.env.PORT || 3000);

app.use(morganLogger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var debugdata = {
	api: [
		{
			url: "/api/retainment",
			method: "POST",
			parameters: ["companyId"]
		},
		{
			url: "/api/retainment",
			method: "GET",
			parameters: ["companyId"]
		}
	],
	requestsSucceeded: 0,
	requestsFailed: 0
};



// Express.js stuff:

app.get('/', function(req, res) {
	res.json(debugdata);
});


app.post('/api/retainment', handleRetainmentRequest);
app.get('/api/retainment',handleRetainmentRequest);

function handleRetainmentRequest(req, res) {
	var companyId = req.body.companyId || req.query.companyId;

	if(!companyId) return res.json({err: 'missing companyId'});

	retainmentApi.getRetainment(companyId, (err, data) => {
		if(err) {
			debugdata.requestsFailed++;
			debugdata.lastError = err;
			return utils.sendError(err, res);
		}

		debugdata.requestsSucceeded++;
		res.json(data);
	});
}


// express.js error handler:
app.use(function (err, req, res, next) {
	if(!err.status) err.status = 500;

	res.status(err.status);

	if(err.status == 404)
		return res.send(err.toString()); // 404 errors are not worth logging.

	if (app.get('env') === 'production'){
		console.log(err.stack);
		return res.send("An error occured: " + err.status); // don't log to user
	} else {
		next(err); // log to console and user
	}
});


var webserver = app.listen(app.get('port'), function() {
	console.log('HTTP server listening on port ' + webserver.address().port);
});
