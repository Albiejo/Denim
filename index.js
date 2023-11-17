require('dotenv').config()
const mongoose=require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/denim_stores');
const express = require("express");
const app = express()
const Port = process.env.port



app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static("public"))
app.use('/cloud_images', express.static('cloud_images'));
app.use('/BannerImages', express.static('BannerImages'));
app.use('/croppedimages' , express.static('croppedimages'));




const userroutes=require("./routes/userroutes")
const adminRoute=require("./routes/adminroutes")



app.use('/',userroutes)
app.use('/admin',adminRoute)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});


app.listen(Port,()=>{console.log("server started running...!")})