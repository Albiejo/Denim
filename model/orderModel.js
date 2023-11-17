const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const orderSchema = new mongoose.Schema({
    customerId:{
        type:Types.ObjectId,
        ref: 'customer',
        required:true
    },
    Items:[
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
            status:{
                type:String
            },
            return:{
                type:Boolean
            },
            returnStatus:{
                type:String
            },
            returnReason:{
                type:String
            }
        }
    ],
    Address:{
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
        
    },
   
    paymentMethod:{
        type:String,
        required:true
    },
    shippingcharge:{
        type:Number 
    },
    discount:{
        type:Number 
    },
    totalAmount:{
        type:Number 
    },
    total:{
        type:Number
    },
    createdOn:{
        type:Date
    },
    status: {
        type: String,
        required: true,
        default: "Pending" // If you want a default value
    },
    deliveredOn:{
        type:String
    },
    orderId:{
        type:String,
        required:true
    },
    return:{
        type:Boolean
    },
    returnStatus:{
        type:String
    },
    returnReason:{
        type:String
    },
    grandTotal:{
        type:Number
    },
    payment:{
        type:String
    }



})

module.exports = mongoose.model('Order', orderSchema , 'Order')