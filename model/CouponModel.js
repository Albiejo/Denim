const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({

    minimumAmount:{
        type:Number
    },
    maximumAmount:{
        type:Number
    },
    Discription:{
        type:String
    },
    Expiry:{
        type:Date,
        required: true
    },
    Code:{
        type:String
    },
    Discount:{
        type:Number
    },
    customers:[
        {
            customerId:{
                type:String
            }
        }
    ]
   
    
})



module.exports = mongoose.model('coupon', couponSchema , 'coupon')