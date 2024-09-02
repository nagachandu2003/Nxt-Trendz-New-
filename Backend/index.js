const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const {MongoClient} = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();


const uri = process.env.mongo_uri;
const secrettoken = process.env.mysecrettoken;
const client = new MongoClient(uri);
const dbname = "nxttrendz";
const collection_name = "users";
let usersCollection;
let productsCollection;
let subadminsCollection;
let result = "UnSuccessful";

const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      jwt.verify(jwtToken, secrettoken, async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          request.username = payload.username;
          next();
        }
      });
    }
  };



const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
    usersCollection = client.db(dbname).collection(collection_name);
    productsCollection = client.db(dbname).collection("products");
    result = "Successful";
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
    throw err; // Consider throwing the error to handle it properly where it's used
  }
};

// Function to close the database connection
const disconnectFromDatabase = async () => {
  try {
    await client.close();
    console.log(`Disconnected from the ${dbname} database`);
  } catch (err) {
    console.error(`Error disconnecting from the database: ${err}`);
  }
};

app.use(async (req, res, next) => {
    if (!client) {
      try {
        await connectToDatabase();
      } catch (err) {
        return res.status(500).json({ message: "Internal Server Error: Failed to connect to the database" });
      }
    }
    next();
  });


  app.get("/", (req,res) => {
    // Connect to database
    res.json("Hello World");
})

// Route to upload products
app.post('/upload-product', async (req, res) => {
    try {
        const jsonArray = req.body;

        // Create the product object with parsed values
        const productData = jsonArray.map((ele) => ({
            title:ele.title,
            categoryId : ele.categoryId,
            brand:ele.brand,
            price: parseFloat(ele.price), // Ensure price is stored as a number
            id: parseInt(ele.id, 10), // Ensure id is stored as an integer
            imageUrl: ele.imageUrl,
            rating: parseFloat(ele.rating) // Ensure rating is stored as a number
        }));

        // Insert the product data into the MongoDB collection
        // console.log(productData)
        const result = await productsCollection.insertMany(productData);

        res.status(201).json({ message: 'Product inserted successfully', result });
    } catch (err) {
        res.status(500).json({ message: `Error Occurred: ${err.message}` });
    }
});


// Sign Up Route
app.post("/register", async (req,res) => {
    try{
        const {username,name,password,gender,location} = req.body;
        // Finding if the username already exists
        const user = await usersCollection.findOne({username:req.body.username});

        if(user)
            res.status(404).json({message : `User Already Exists`})
        else{
            if (password.length < 6) {
                res.status(400).json({message : "Password is too short"});
              } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                const result = await usersCollection.insertOne({
                    name : req.body.name,
                    username : req.body.username,
                    password : hashedPassword,
                    gender : req.body.gender,
                    location : req.body.location
                });
                if(res.acknowledged)
                res.status(200).json({message : "User Inserted Successfully",result});
                else{
                    res.status(200).json({message : "Unable to Insert User"});
                }
        }
    }
}
    catch(Err){
        res.json({message:`Error Occurred : ${Err}`});
    }
})

// Login Route
app.post("/login", async (req,res) => {
    try{
        const dbUser = await usersCollection.findOne({username:req.body.username})
        if (!dbUser) {
            res.status(400).json({error_msg : "Invalid User"});
        } else {
            const isPasswordMatched = await bcrypt.compare(req.body.password, dbUser.password);
            if (isPasswordMatched === true) {
            const payload = {
                username: req.body.username,
            };
            const jwtToken = jwt.sign(payload, secrettoken);
            res.status(200).send({ jwt_token : jwtToken });
            } else {
                res.status(400).json({error_msg : "Invalid User"})
            }
        }
    }
    catch(Err){
        res.status(404).json({Error :`Error Occurred : ${Err}`})
    }
})


// Users Route

app.get("/users", async (req,res) => {
    try{
        const result = await usersCollection.find({}).toArray();
        res.status(200).json({users:result})
    }
    catch(Err){
        res.json({message:`Error Occurred : ${Err}`})
    }
})

app.get("/products", authenticateToken, async (req, res) => {
  try {
      // Initialize an empty query object
      const query = {};

      // Add categoryId to query if it's defined
      if (req.query.category) {
          query.categoryId = req.query.category;
      }

      // Add rating to query if it's defined and a valid number
      if (req.query.rating) {
          query.rating = { $gte: parseFloat(req.query.rating) };
      }

      // Add title_search to query if it's defined
      if (req.query.title_search) {
          query.title = { $regex: req.query.title_search, $options: 'i' };
      }

      // Determine the sort order based on the activeOptionId
      const sort = req.query.activeOptionId === 'PRICE_HIGH' ? { price: -1 } : { price: 1 };

      // Fetch the products from the database based on the constructed query and sort order
      const products = await productsCollection.find(query).sort(sort).toArray();
      res.status(200).json({ products });
  } catch (Err) {
      res.status(404).json({ Error: `Error Occurred: ${Err}` });
  }
});

app.get("/products/:id",authenticateToken,async (req,res) => {
  try{
    const result = await productsCollection.find({id:parseInt(req.params.id)}).toArray();
    res.status(200).send(result[0]);
}
catch(Err){
    res.json({message:`Error Occurred : ${Err}`})
}
})


// app.get("/products",authenticateToken, async (req,res) => {
//     try{
//         console.log(req.query);
//         const query = {
//             categoryId: req.query.category, // Match the category
//             rating: { $gte: parseFloat(req.query.rating) }, // Match the rating
//             title: { $regex: req.query.title_search, $options: 'i' }, // Case-insensitive title search
//           };
          
//           const sort = activeOptionId === 'PRICE_HIGH' ? { price: -1 } : { price: 1 }; // Sort by price
          
//           const products = await productsCollection.find(query).sort(sort).toArray();
//           console.log(products);
//           res.status(200).json({products});
//         // const result = await productsCollection.find().toArray();
//         // res.status(200).json({})
//     }
//     catch(Err){
//         res.status(404).json({Error : `Error Occurred : ${Err}`})
//     }
// })



connectToDatabase()
  .then(() => {
    app.listen(3001, () => {
      console.log(`Server is running on port ${3001}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start the server:", err);
  });