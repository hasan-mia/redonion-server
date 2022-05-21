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


//==============================//
//			Tokeyn Verify		//
//==============================//
function verifyJWT(req, res, next) {
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

		//==============================//
		//			Admin Verify		//
		//==============================//
		const verifyAdmin = async (req, res, next) => {
		const userEmail = req.decoded.email;
		const userAccount = await userCollection.findOne({ email: userEmail });
		if (userAccount.role === 'admin') {
			next();
		}
		else {
			res.status(403).send({ message: 'forbidden' });
		}
		}

		// ===Create authentication Token by Email===
        app.put('/signin/:email', async (req, res) => {
			const email = req.params.email;
			const user = req.body;
			const filter = { email: email };
			const options = { upsert: true };
			const updateUser = {
				$set: {...user},
			};
			const result = await userCollection.updateOne(filter, updateUser, options);
			const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, /*{ expiresIn: '1h' }*/)
			res.send({ result, token });

        })

		//==============================//
		//			User Controller		//
		//==============================//

		// Get All Users
		app.get('/users', verifyJWT, async (req, res) => {
			const users = await userCollection.find().toArray();
			res.send(users);
		});

		// Make admin by Email
        app.put('/user/admin/:email',verifyJWT, verifyAdmin, async (req, res) => {
			const email = req.params.email;
			const filter = { email: email };
			const updateAdmin = {
				$set: { role: 'admin' },
			};
			const result = await userCollection.updateOne(filter, updateAdmin);
			res.send(result);
        })

		// Get Admin Access
		app.get('/admin/:email', async (req, res) => {
			const email = req.params.email;
			const user = await userCollection.findOne({ email: email });
			const isAdmin = user?.role === 'admin';
			res.send({ admin: isAdmin })
		})

		// Delete User by Email
		app.delete('/delete-admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
			const email = req.params.email;
			const filter = { email: email };
			const result = await userCollection.deleteOne(filter);
			res.send(result);
		})

		//==============================//
		//		Category Controller		//
		//==============================//

		// ====Add Category======
		 app.post('/category', verifyJWT, verifyAdmin, async (req, res) => {
		 	const category = req.body;
		 	const result = await categoryCollection.insertOne(category);
		 	res.send(result);
		 });
		 // ====Get Categories======
		 app.get('/categories',verifyJWT, verifyAdmin, async (req, res) => {
		 	const query = {};
		 	const cursor = categoryCollection.find(query);
		 	const categories = await cursor.toArray();
		 	res.send(categories);
		 });

		// ====Update Category======
		app.patch('/category/:id',verifyJWT, verifyAdmin, async (req, res)=>{
			const id = req.params.id;
			const category = req.body;
			const filter = {_id: ObjectId(id)};
			const options ={ upsert: true };
			const updateCategory = {
				$set: {...category}
			};
			const result = await categoryCollection.updateOne(filter, updateCategory, options);
			res.send(result);
		});

		// ====Delete Categories======
		app.delete('/category/:id',verifyJWT, verifyAdmin, async(req, res) => {
			const id = req.params.id;
		    const categoryId = { _id: ObjectId(id) };
		    const result = await categoryCollection.deleteOne(categoryId);
		    res.send(result);
		});

	

		 // ====Get Categories======
		// Warning: This is not the proper way to query multiple collection. 
    	// After learning more about mongodb. use aggregate, lookup, pipeline, match, group
    	// app.get('/available', async (req, res) => {
		// 	const date = req.query.date;

		// 	// step 1:  get all categories
		// 	const categories = await categoryCollection.find().toArray();

		// 	// step 2: get the Products of that day. output: [{}, {}, {}, {}, {}, {}]
		// 	const query = { date: date };
		// 	const products = await productCollection.find(query).toArray();

		// 	// step 3: for each service
		// 	categories.forEach(category => {
		// 	// step 4: find bookings for that service. output: [{}, {}, {}, {}]
		// 	const serviceBookings = products.filter(product => book.treatment === service.name);
		// 	// step 5: select slots for the service Bookings: ['', '', '', '']
		// 	const bookedSlots = serviceBookings.map(book => book.slot);
		// 	// step 6: select those slots that are not in bookedSlots
		// 	const available = service.slots.filter(slot => !bookedSlots.includes(slot));
		// 	//step 7: set available to slots to make it easier 
		// 	service.slots = available;
      	// });
      	// res.send(services);
    	// })
		
		 


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