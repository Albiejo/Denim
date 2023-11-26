require('dotenv').config()
const mongoose=require('mongoose')

mongoose.connect("mongodb+srv://albiejosephs101:FYiPv0bBl88IGOVv@denimstores-db.yjh7hie.mongodb.net/denim_stores?retryWrites=true&w=majority")
.then(()=>console.log("mongoose connected"))

const express = require("express");
const app = express()
const Port = process.env.port
 


app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static("public"))
app.use('/cloud_images', express.static('cloud_images'));
app.use('/BannerImages', express.static('BannerImages')); 




const userroutes=require("./routes/userroutes")
const adminRoute=require("./routes/adminroutes")



app.use('/',userroutes)
app.use('/admin',adminRoute)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});


app.listen(Port,()=>{console.log("server started running...!")})
