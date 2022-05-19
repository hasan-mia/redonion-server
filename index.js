const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const {
	MongoClient,
	ServerApiVersion
} = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());
// port
const port = process.env.PORT || 5000


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.evg4w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1
});

function verify(req, res, next) {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).send({
			message: 'UnAuthorized access'
		});
	}
	const token = authHeader.split(' ')[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
		if (err) {
			return res.status(403).send({
				message: 'Forbidden access'
			})
		}
		req.decoded = decoded;
		next();
	});
}

// ===============All API==============
async function run() {
	try {
		client.connect();
		console.log('DB Connected');
		const userCollection = client.db("redonions").collection("users");
		const categoryCollection = client.db("redonions").collection("categories");
		const productCollection = client.db("redonions").collection("products");
		const cartCollection = client.db("redonions").collection("carts");
		const blogCollection = client.db("redonions").collection("blogs");

		// AUTH Token by Email
        app.put('/signin/:email', async (req, res) => {
			const email = req.params.email;
			const user = req.body;
			const filter = { email: email };
			const options = { upsert: true };
			const updateUser = {
				$set: {...user},
			};
			const result = await userCollection.updateOne(filter, updateUser, options);
			const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
			res.send({ result, token });

        })

		// Get All Users
		app.get('/users', verifyJWT, async (req, res) => {
			const users = await userCollection.find().toArray();
			res.send(users);
		});


	} catch (error) {
		console.log(error);
	} finally {

	}
}
run().catch(console.dir)


app.get('/', (req, res) => {
	res.send('RedOnin Server is Running')
})

app.listen(port, () => {
	console.log(`RedOnin Server listening on port ${port}`)
})