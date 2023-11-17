const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_admin: {
        type: Number
    },
    list: {
        type: Boolean,
        required: true
    },
    cart: [
        {
            productId: {
                type: Types.ObjectId,
                ref: 'products'
            },
            quantity: {
                type: Number
            },
            size:{
                type:String
            },
            subtotal:{
                type:Number,
            },
            color:{
                type:String
            }
        }
    ]
    ,
    wishlist:[
        {
            productId: {
                type: Types.ObjectId,
                ref: 'products'
            }
        }
    ],
    Address:[
        {
            Name:{
                type:String,
            },
            Housename:{
            type:String,
           
            },

            Street:{
                type:String,
               
            },
            Pincode:{
                type:Number
            },
            Country:{
                type:String
            },
            Phone:{
                type:Number
            }
            
        }
    ],
    CartTotal:{
        type:Number
    },
    wallet:{
        type:Number
    },
    transactionDetails:[{
        transactionType:{
            type:String
        },
        transactionAmount:{
            type:Number
        },
        transactionDate:{
            type:Date
        },
        orderId:{
           type:String
        }
    }],
    coupon:{
        type:Boolean
    },
    referralCode:{
        type:String
    }
})


module.exports = mongoose.model('customer', userSchema , 'customer')
