const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment');
const fs = require('fs');

// Web server
const app = express();

const SERVER_PORT = 8080;
const DATABASE_NAME = "timerequester.db";

// In-memory database
let database = {
	requestData: [],
	activityLogs: []
};

// Test data
/**
database.requestData = [
	{
		id: 1,
    	firstname: "Alex",
    	lastname: "Duranleau",
    	email: "alex.duranleau@gmail.com",
    	phone: "418-839-0767",
    	onsite: "yes",
    	description: "I want the WIFI password.",
    	status: "New",
    	date: moment().format('YYYY-MM-DDTHH:MM'),
    	created: new Date
    },
	{
		id: 2,
    	firstname: "Maélie",
    	lastname: "Duranleau",
    	email: "maelie.duranleau@gmail.com",
    	phone: "418-839-0767",
    	onsite: "yes",
    	description: "I need help with my english homework.",
    	status: "New",
    	date: moment().format('YYYY-MM-DDTHH:MM'),
    	created: new Date
    },
	{
		id: 3,
    	firstname: "Laura",
    	lastname: "Duranleau",
    	email: "laura.duranleau@gmail.com",
    	phone: "418-839-0767",
    	onsite: "yes",
    	description: "I want a hug!",
    	status: "New",
    	date: moment().format('YYYY-MM-DDTHH:MM'),
    	created: new Date
    }
];
*/

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/requests', (req, res) => {
	res.json(database.requestData);
});

app.get('/logs', (req, res) => {
	res.json(database.activityLogs);
});

app.get('/requests/:id', (req, res) => {
	res.json(getRequest(req.params.id));
});

app.post('/request', (req, res) => {
	res.send('{"id":"' + createRequest(req.body) + '"}');
});

app.put('/request', (req, res) => {
	res.send('{"id":"' + updateRequest(req.body) + '"}');
});

app.delete('/request/:id', (req, res) => {
	deleteRequest(req.params.id);
	res.send('{"id":"' + req.params.id + '"}');
});

app.listen(SERVER_PORT, function() {
	loadDatabase(DATABASE_NAME);
	addLogActivity({
		type: "system",
		action: "server start"
	});
	console.log(`Time requester services listening on port ${SERVER_PORT}!`);
});

function getRequest(id) {
	var request = "{}";
	database.requestData.forEach(r => {
		if (r.id == id) {
			request = r;
		}
	});
	return request;
}

function deleteRequest(id) {
	var newRequests = [];
	var found = false;
	database.requestData.forEach(r => {
		if (r.id != id) {
			newRequests.push(r);
		} else {
			found = true;
		}
	});
	if (found) {
		database.requestData = newRequests;
		addLogActivity({
			type: "data",
			action: "deleteRequest(" + id + ")"
		});
		refreshDatabase(DATABASE_NAME, database, false);
	}
}

function updateRequest(inputRequest) {
	if (inputRequest.id && getRequest(inputRequest.id).id) {
		var request = getRequest(inputRequest.id);
	    request.firstname = inputRequest.firstname ? inputRequest.firstname : request.firstname,
	    request.lastname = inputRequest.lastname ? inputRequest.lastname : request.lastname,
	    request.email = inputRequest.email ? inputRequest.email : request.email,
	    request.phone = inputRequest.phone ? inputRequest.phone : request.phone,
	    request.onsite = inputRequest.onsite ? inputRequest.onsite : request.onsite,
	    request.description = inputRequest.description ? inputRequest.description : request.description,
	    request.status = inputRequest.status ? inputRequest.status : request.status,
	    request.date = inputRequest.date ? inputRequest.date : request.date,
	    // Output the new request to the console for debugging
	    console.log(request);
		addLogActivity({
			type: "data",
			action: "updateRequest(" + request.id + ")"
		});
	    refreshDatabase(DATABASE_NAME, database, false);
	    return request.id
	} else {
		return createRequest(inputRequest);
	}
}

function createRequest(inputRequest) {
    var newRequest = {
    	id: Date.now(),
    	firstname: inputRequest.firstname,
    	lastname: inputRequest.lastname,
    	email: inputRequest.email,
    	phone: inputRequest.phone,
    	onsite: inputRequest.onsite,
    	description: inputRequest.description,
    	date: inputRequest.date,
    	status: "New",
    	created: new Date
    }
    // Output the new request to the console for debugging
    console.log(newRequest);
    database.requestData.push(newRequest);
	addLogActivity({
		type: "data",
		action: "createRequest(" + newRequest.id + ")"
	});
    refreshDatabase(DATABASE_NAME, database, false);
    return newRequest.id;
}

function addLogActivity(activity) {
	var newActivity = {
		type: activity.type,
		action: activity.action,
		date: new Date
	}
	database.activityLogs.push(newActivity);
}

function refreshDatabase(name, data, sync) {
	if (sync) {
		fs.writeFileSync(name, JSON.stringify(data));
		console.log("Database '" + name + "' updated.");
	} else {
		fs.writeFile(name, JSON.stringify(data), function (err) {
			if (err) throw err;
			console.log("Database '" + name + "' updated.");
		});
	}
}

function loadDatabase(name) {
	try {
		console.log("Loading database...");
		var rawData = fs.readFileSync(name);
		database = JSON.parse(rawData);
		console.log(database.requestData.length + " requests loaded.");
		console.log(database.activityLogs.length + " activities loaded.");
	} catch (err) {
		console.log("No database found.");
	}
}

var onShutdown = function() {
	addLogActivity({
		type: "system",
		action: "server stop"
	});
	refreshDatabase(DATABASE_NAME, database, true);
	process.exit();
}

// listen for TERM signal .e.g. kill
process.on ('SIGINT', onShutdown);
