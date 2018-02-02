#!/usr/bin/env node

const httpreq = require('httpreq');
var crypto = require('crypto');

function getRetainment(companyId, callback) {
	var companyIdClean = companyId.replace(/[^0-9]/g, "");
	var url = 'https://services.socialsecurity.be/REST/coBackend/v1/retainment/' + companyIdClean;

	httpreq.get(url, {
		headers: {
			'X-Hashcash': calculateHashCash(companyIdClean)
		}
	}, (err, res) =>{
		if(err) return callback(err);

		var data = null;
		try{
			data = JSON.parse(res.body);
		}catch(e) {
			return callback(`Response was no JSON: ${res.body}`);
		}

		var moreData = {
			companyId: companyId.trim(),
			companyIdClean: companyIdClean,
			result: data
		};

		callback(null, moreData);
	});
}



function calculateHashCash(companyId) {
	var formatedDate = (new Date).toISOString().slice(2, 10).replace(new RegExp("-","g"), "");
	var uuidWordArray = new Buffer(guid()).toString('base64');
	var prefix = `1:8:${formatedDate}:${companyId}::${uuidWordArray}:`;

	var shaValue = '';
	var result = '';
	for (var counter = 0; !shaValue.startsWith("00"); counter++) {
		var base64Char = new Buffer('' + counter).toString('base64');
		result = prefix + base64Char;
		shaValue = sha1(result);
	}

	return result;
}

function sha1(s) {
	var shasum = crypto.createHash('sha1');
	shasum.update(s);
	return shasum.digest('hex');
}

function guid() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

exports.getRetainment = getRetainment;
