const express = require('express');
const app = express();
const port = 8080;

app.get('/', (req, res) => {
	res.send('Hello World from Express!');
});

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`));
