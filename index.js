require('dotenv').config()
const mongoose=require('mongoose')
const cron=require("node-cron");
const url  = process.env.URL
const express = require("express");
const app = express()
const Port = process.env.PORT || 5000
const axios=require("axios")

mongoose.connect(url)
.then(()=>console.log("mongoose connected"))


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


const SERVER =`http://localhost:${process.env.PORT}`

const start = () => {
    cron.schedule('* * * * *', () => {
      axios.get(SERVER)
       .then(response => console.log('Health check successful'))
       .catch(error => console.error('Health check failed:', error));
    });
}


start();
app.listen(Port,()=>{console.log("server started running...!")})