const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());
// port
const port = process.env.PORT || 5000


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.evg4w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
	try {
		client.connect();
		console.log('DB Connected');
		const categoryCollection = client.db("redonions").collection("categories");
		const productCollection = client.db("redonions").collection("products");
		
	} catch (error) {
		console.log(error);
	}
	finally{

	}
}
run().catch(console.dir)


app.get('/', (req, res) => {
	res.send('RedOnin Server is Running')
})

app.listen(port, () => {
	console.log(`RedOnin Server listening on port ${port}`)
})