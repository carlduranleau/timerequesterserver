const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8080;

// Where we will keep requests
let inputRequests = [
	{
		id: 1,
    	firstname: "Alex",
    	lastname: "Duranleau",
    	email: "alex.duranleau@gmail.com",
    	phone: "418-839-0767",
    	onsite: "yes",
    	description: "I want the WIFI password.",
    	status: "New",
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
    	created: new Date
    }
];


app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/requests', (req, res) => {
	res.json(inputRequests);
});

app.get('/requests/:id', (req, res) => {
	res.json(getRequest(req.params.id));
});

app.post('/request', (req, res) => {
	createRequest(req.body);
});

app.put('/request', (req, res) => {
	updateRequest(req.body);
});

app.listen(port, () => console.log(`Time requester services listening on port ${port}!`));

function getRequest(id) {
	var request = "{}";
	inputRequests.forEach(r => {
		if (r.id == req.params.id) {
			request = r;
		}
	});
	return request;
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
	    // Output the new request to the console for debugging
	    console.log(inputRequest);
	    res.send('{"status":"ok"}');
	} else {
		createRequest(inputRequest);
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
    	status: "New",
    	created: new Date
    }
    // Output the new request to the console for debugging
    console.log(inputRequest);
    inputRequests.push(inputRequest);
    res.send('{"status":"ok"}');
}