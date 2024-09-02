const express = require('express');
const app = express();
const userModel = require("./models/user");
const contentModel = require("./models/content");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs')

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser())

app.get("/", function(req,res){
    res.redirect("/home");
});

app.get("/register", function(req,res){
    res.render("register");
})


app.get("/profile", isLoggedIn ,async (req,res) => {
    res.render("profile")
})


app.post("/register", async function(req,res){
    let {username,name,age,email,password} = req.body;
    let user = await userModel.findOne({email : email})
    if(user){
        res.send("User already exists");
    }
    
    bcrypt.genSalt(10, function(err,salt){
        bcrypt.hash(password,salt, async function(err,hash){
            
            let user = userModel.create({
                username,
                name,
                email,
                age,
                email,
                password : hash
            });
            
            let token = jwt.sign({email : email, userid : user._id}, "shhhh");
            res.cookie("token", token);
            res.send("registered");
        })
    })
    
    // res.send(user);
});


app.get("/login",function(req,res){
    res.render("login");
})

app.post("/login", async function(req,res){
    let {email,password} = req.body;
    
    let user = await userModel.findOne({email});
    if(!user){
       return res.status(500).send("Something is Wrong");
    }

    bcrypt.compare(password,user.password, (err,result) => {
        if(result){
            let token = jwt.sign({email,userid : user._id}, "shhhh");
            res.cookie("token",token);
            res.redirect("/home");
        }
    })


});


app.get("/logout",function(req,res){
    res.cookie("token","");
    res.redirect("/login")
})


function isLoggedIn(req, res, next) {
    // Check if the token exists in cookies
    const token = req.cookies.token;

    if (!token) {
        // If no token, redirect to the login page
        return res.redirect("/login");
    }

    let data = jwt.verify(token,"shhhh")
    req.user = data;
    next();
}


app.get("/home",isLoggedIn,function(req,res){
    res.render("home")
})


app.get("/profile",isLoggedIn,function(req,res){
    res.render("profile")
})


app.get("/write",isLoggedIn,function(req,res){
    res.render("write");
});

app.post("/write",isLoggedIn,function(req,res){

    let {email,title,content} = req.body;

    let article = contentModel.create({
        email,
        title,
        content
    });

    res.redirect("/home");

});



app.listen(3000);