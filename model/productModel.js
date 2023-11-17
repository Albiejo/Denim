const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    productName: {
        type: String,
       
    },
    Discription: {
        type: String,
      
    },
    size:{
        type:Array,
       
    },
    brand:{
        type:String,
        

    },
    category:{
        type:String,
        

    },
    regularPrice:{
        type:Number,
      

    },
    offerPrice:{
        type:Number,
       

    },
    images:[
        {
            url:{
                type:String,
                

            }
        }
    ],
    stock:{
        type:Number,
       

    },
    list:{
        type:Boolean,
        

    },
    gender:{
        type:String,
      

    },
    createdOn:{
        type:Date,
        

    },
    reviews:[
        {
            customerName:{
                type:String
            },
            review:{
                type:String
            },
            date:{
                type:Date
            },
            rating:{
                type:Number
            }
        }
    ],
    totalRatings: {
        type: Number,
        default: 0,
    },
    averageRating: {
        type: Number,
        default: 0,
    }
});


module.exports=mongoose.model("products",productSchema);