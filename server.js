const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment');
const fs = require('fs');

// Web server
const app = express();

const SERVER_PORT = 8080;
const DATABASE_NAME = "timerequester.db";
const SESSION_TIMEOUT = 1800	//Session timeout in seconds

// In-memory database
let database = {
	requestData: [],
	activityLogs: [],
	users: []
};

// Authentication tokens
let authtokens = [];

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/requests', (req, res) => {
	if (!checkToken(req.query.token)) {
		console.log("Error!");
		res.status(403).send("{}");
	} else {
		console.log("Valid!");
		res.json(database.requestData);
	}
});

app.get('/logs', (req, res) => {
	if (!checkToken(req.query.token)) {
		res.status(403).send("{}");
	} else {
		res.json(database.activityLogs);
	}
});

app.get('/requests/:id', (req, res) => {
	if (!checkToken(req.query.token)) {
		res.status(403).send("{}");
	} else {
		res.json(getRequest(req.params.id));
	}
});

app.post('/request', (req, res) => {
	res.send('{"id":"' + createRequest(req.body) + '"}');
});

app.post('/login', (req, res) => {
	var authinfo = req.body;
	var token = login(authinfo);
	if (token) {
		res.send('{"token":"' + token + '"}');
	} else {
		res.status(403);
		res.send('{"token":""}');
	}
});

app.put('/request', (req, res) => {
	if (!checkToken(req.query.token)) {
		res.status(403).send("{}");
	} else {
		res.send('{"id":"' + updateRequest(req.body) + '"}');
	}
});

app.delete('/request/:id', (req, res) => {
	if (!checkToken(req.query.token)) {
		res.status(403).send("{}");
	} else {
		deleteRequest(req.params.id);
		res.send('{"id":"' + req.params.id + '"}');
	}
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
		console.log(database.users.length + " users loaded.");
	} catch (err) {
		console.log("No database found.");
	}
}

function login(authinfo) {
	var authtoken;
	database.users.forEach(t => {
		if (t.user == authinfo.user && t.pass == authinfo.pass) {
			var newtoken = createUUID();
			authtokens.push({
				token: newtoken,
				expiration: Date.now() + (SESSION_TIMEOUT * 1000)
			});
			authtoken = newtoken;
		}
	});
	return authtoken;
}

function removeToken(token) {
	var filteredtokens = [];
	authtokens.forEach(a => {
		if (a.token != token) {
			filteredtokens.push(a);
		}
	});
	authtokens = filteredtokens;
}

function checkToken(token) {
	console.log("Token:");
	console.log(token);
	var status = false;
	if (!token) {
		return false;
	}
	var currentDate = Date.now();
	console.log("currentDate:");
	console.log(currentDate);
	authtokens.forEach(a => {
		if (a.token == token) {
			console.log("expiration:");
			console.log(a.expiration);
			if (a.expiration > currentDate) {
				console.log("Valid token");
				a.expiration = Date.now() + (SESSION_TIMEOUT * 1000);
				status = true;
			} else {
				console.log("Remove token");
				removeToken(a.token);
			}
		}
	});
	return status;
}

function createUUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
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
