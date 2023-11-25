const mongoose=require('mongoose');

const categorySchema=mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },

    list:{
        type:Boolean,
        required:true
    },
    createdOn:{
        type:Date
    }
})

module.exports=mongoose.model("category" , categorySchema , "category")