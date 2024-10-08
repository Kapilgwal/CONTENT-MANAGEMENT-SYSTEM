const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const axios = require('axios');
const userModel = require("./models/user");
const contentModel = require("./models/content");

// Set up middleware
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Root route redirects to home
app.get("/", (req, res) => {
    res.redirect("/home");
});

// Render register page
app.get("/register", (req, res) => {
    res.render("register");
});

// Register a new user
app.post("/register", async (req, res) => {
    try {
        const { username, name, age, email, password } = req.body;
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(400).send("User already exists");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await userModel.create({
            username,
            name,
            age,
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ email: user.email, userid: user._id }, "shhhh");
        res.cookie("token", token);
        res.send("Registered successfully");
    } catch (error) {
        res.status(500).send("Error registering user: " + error.message);
    }
});

// Render login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Log in an existing user
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).send("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ email: user.email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.redirect("/home");
        } else {
            res.status(400).send("Invalid email or password");
        }
    } catch (error) {
        res.status(500).send("Error logging in: " + error.message);
    }
});

// Log out the user
app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

// Middleware to check if the user is logged in
function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/login");
    }

    try {
        const data = jwt.verify(token, "shhhh");
        req.user = data;
        next();
    } catch (error) {
        res.status(401).send("Invalid token");
    }
}

// Render home page with posts
app.get("/home", isLoggedIn, async (req, res) => {
    try {
        const contents= await contentModel.find()
            .populate('user', 'username')
            .populate('likes', 'username')
            .populate('username','username');

        res.render("home", { contents});
    } catch (error) {
        res.status(500).send("Error fetching content: " + error.message);
    }
});

// Render profile page
app.get("/profile", isLoggedIn,async (req, res) => {
    let {email} = req.body;
    const contents = await contentModel.find().populate('user','username').populate('likes','username').populate('username','username');
    res.render("profile",{contents});
});

// Render write page
app.get("/write", isLoggedIn, (req, res) => {
    res.render("write");
});

// Submit a new post
app.post("/write", isLoggedIn, async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.user.userid;

        await contentModel.create({
            user: userId,
            title,
            content
        });

        res.redirect("/home");
    } catch (error) {
        res.status(500).send("Error creating post: " + error.message);
    }
});

app.get("/read/:id", async (req, res) => {
    try {
        // Fetch the post by its ID and populate the 'user' field
        let post = await contentModel.findOne({ _id: req.params.id }).populate("user");

        // Check if the post exists
        if (!post) {
            return res.status(404).send('Post not found');
        }

        // Render the 'read' view and pass the post data
        res.render("read", { post });
    } catch (err) {
        // Handle any errors that occur during the process
        console.error(err);
        res.status(500).send('An error occurred while retrieving the post');
    }
});

app.get("/update/:id", isLoggedIn, async (req,res) => {
    try {
        // Fetch the post by its ID and populate the 'user' field
        let post = await contentModel.findOne({ _id: req.params.id }).populate("user");

        // Check if the post exists
        if (!post) {
            return res.status(404).send('Post not found');
        }

        // Render the 'read' view and pass the post data
        res.render("update", { post });
    } catch (err) {
        // Handle any errors that occur during the process
        console.error(err);
        res.status(500).send('An error occurred while retrieving the post');
    }
})

app.post("/update/:id", isLoggedIn, async (req,res) => {
    let post = await contentModel.findOneAndUpdate({ _id: req.params.id }, {content : req.body.content,title : req.body.title}).populate("user");
    res.redirect("/home");  
})

app.get("/delete/:id", isLoggedIn, async (req,res) => {
    let post = await contentModel.deleteOne({_id : req.params.id});
    res.redirect("/home");  
})



app.get("/summarise/:id", isLoggedIn, async (req,res) => {
    let post = await contentModel.findOne({_id : req.params.id}).populate("user");
    let title = post.title;
    let content = post.content;
    let blogPost;

    try {
        const response = await axios.post('http://localhost:5000/generate-blog', {
            input_text: content,
            no_words: 100,
            blog_style: 'Researcher'
        });

        blogPost = response.data.result;
    } catch (error) {
        // res.status(500).send("Error generating blog.");
    }
  
    res.send({blogPost});
})

app.get("/like/:id", isLoggedIn, async (req,res) => {
    let post = await contentModel.findOne({_id : req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userId) === -1){
        post.likes.push(req.user.userId);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userId),1);
    }

    await post.save();
    // res.redirect("/home");
})

// Render messages page
app.get("/messages", isLoggedIn, (req, res) => {
    res.render("messages");
});

// Start the server
app.listen(3000);
