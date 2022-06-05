const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
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
		const paymentCollection = client.db("redonions").collection("payments");
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

		//==============================//
		//			Vairfy Editor		//
		//==============================//
		const verifyEditor = async (req, res, next) => {
		const userEmail = req.decoded.email;
		const userAccount = await userCollection.findOne({ email: userEmail });
		if (userAccount.role === 'editor') {
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

		// Make Editor by Email
        app.put('/user/editor/:email',verifyJWT, verifyAdmin, async (req, res) => {
			const email = req.params.email;
			const filter = { email: email };
			const updateEditor = {
				$set: { role: 'editor' },
			};
			const result = await userCollection.updateOne(filter, updateEditor);
			res.send(result);
        })

		// Get Editor Access
		app.get('/editor/:email',verifyJWT, verifyEditor, async (req, res) => {
			const email = req.params.email;
			const user = await userCollection.findOne({ email: email });
			const isEditor = user?.role === 'editor';
			res.send({ editor: isEditor })
		})

		// Delete User by Email
		app.delete('/delete-user/:email', verifyJWT, verifyAdmin, async (req, res) => {
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
		 app.get('/categories', async (req, res) => {
		 	const query = {};
		 	const cursor = categoryCollection.find(query);
		 	const categories = await cursor.toArray();
		 	res.send(categories);
		 });

		// ====Update Category======
		app.put('/category/:id', verifyJWT, verifyAdmin, async (req, res)=>{
			const id = req.params.id;
			const category = req.body;
			const filter = {_id: ObjectId(id)};
			const options ={ upsert: true };
			const updateCategory = {
				$set: category
				// $set: {
				// 	title: category.title,
				// 	description: category.description,
				// 	img: category.img
				// }
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


		//==============================//
		//		Products Controller		//
		//==============================//

		// ====Add Product======
		 app.post('/product', verifyJWT, verifyAdmin, async (req, res) => {
		 	const product = req.body;
		 	const result = await productCollection.insertOne(product);
		 	res.send(result);
		 });
		 // ====Get Products======
		 app.get('/products', async (req, res) => {
		 	const query = {};
		 	const cursor = productCollection.find(query);
		 	const products = await cursor.toArray();
		 	res.send(products);
		 });

		// ====Update Product======
		app.patch('/product/:id', verifyJWT, verifyAdmin, async (req, res)=>{
			const id = req.params.id;
			const product = req.body;
			const filter = {_id: ObjectId(id)};
			const options ={ upsert: true };
			const updateProduct = {
				$set: product
			};
			const result = await productCollection.updateOne(filter, updateProduct, options);
			res.send(result);
		});

		// ====Delete Product======
		app.delete('/product/:id',verifyJWT, verifyAdmin, async(req, res) => {
			const id = req.params.id;
		    const productId = { _id: ObjectId(id) };
		    const result = await productCollection.deleteOne(productId);
		    res.send(result);
		});

		//==============================//
		//	   Cart/Order Controller	//
		//==============================//

		//=========Add Order======
		 app.post("/order", async (req, res) => {
            const orderItem = req.body;
            const result = await cartCollection.insertOne(orderItem);
            res.send(result)
        })
		// =========Update Order======
		app.patch('/order/:id', verifyJWT, verifyAdmin, async (req, res)=>{
			const id = req.params.id;
			const order = req.body;
			const filter = {_id: ObjectId(id)};
			const options ={ upsert: true };
			const updateOrder = {
				$set: order
			};
			const result = await cartCollection.updateOne(filter, updateOrder, options);
			res.send(result);
		});

		//=========Get All Order=======
		 app.get("/orders", async (req, res) => {
            const query = {};
			const cursor =  cartCollection.find(query);
			const orders = await cursor.toArray();
            res.send(orders)
        })

		//=========Get Order by Email======
		app.get("/myorders", verifyJWT, async (req, res) => {
            const tokenInfo = req.headers.authorization;
            const [email, accessToken] = tokenInfo.split(" ")
			const decodedEmail = req.decoded.email;
			
            if (email === decodedEmail) {
                const myorders = await cartCollection.find({email: email}).toArray();
				console.log(myorders);
                res.send(myorders);
            }
            else {
                return res.status(403).send({ success: 'Forbidden Access' })
            }
		})

		 // ====Get Signle Order=====
		app.get('/order/:id', async(req, res) =>{
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const order = await cartCollection.findOne(query);
			res.send(order);
		})

		// =======Update Stripe payment order======
		app.patch('/order/:id', async(req, res) =>{
			const id  = req.params.id;
			const payment = req.body;
			const filter = {_id: ObjectId(id)};
			const updatedItem = {
				$set: {
				paid: true,
				transactionId: payment.transactionId
				}
			}

			const result = await paymentCollection.insertOne(payment);
			const updatedOrder = await cartCollection.updateOne(filter, updatedItem);
			res.send(updatedOrder);
		})

		 // ====Delete Order======
		app.delete('/order/:id', async (req, res) => {
			const id = req.params.id;
		    const orderId = { _id: ObjectId(id) };
		    const result = await cartCollection.deleteOne(orderId);
		    res.send(result);
		});


		//==============================//
		//		Blogs Controller		//
		//==============================//

		// ====Add Blog======
		 app.post('/blog', verifyJWT, verifyAdmin, async (req, res) => {
		 	const blog = req.body;
		 	const result = await blogCollection.insertOne(blog);
		 	res.send(result);
		 });
		 // ====Get Blogs======
		 app.get('/blogs', async (req, res) => {
		 	const query = {};
		 	const cursor = blogCollection.find(query);
		 	const blogs = await cursor.toArray();
		 	res.send(blogs);
		 });

		// ====Update Blog======
		app.patch('/blog/:id', verifyJWT, verifyAdmin, async (req, res)=>{
			const id = req.params.id;
			const blog = req.body;
			const filter = {_id: ObjectId(id)};
			const options ={ upsert: true };
			const updateBlog = {
				$set: blog
			};
			const result = await blogCollection.updateOne(filter, updateBlog, options);
			res.send(result);
		});

		// ====Delete Blog======
		app.delete('/blog/:id',verifyJWT, verifyAdmin, async(req, res) => {
			const id = req.params.id;
		    const blogId = { _id: ObjectId(id) };
		    const result = await blogCollection.deleteOne(blogId);
		    res.send(result);
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