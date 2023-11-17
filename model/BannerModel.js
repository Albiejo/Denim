const mongoose = require('mongoose');

const BannerSchema = mongoose.Schema({
    Discription:{
        type:String
    },

    status:{
        type:Boolean
    },

    Image: { 
        type: String,
        required: true   
    },
    h1:{
    type:String
    },
    h2:{
        type:String
    },
    h3:{
        type:String
    },
    p1:{
        type:String
    }

})

module.exports = mongoose.model("Banner", BannerSchema, "Banner")