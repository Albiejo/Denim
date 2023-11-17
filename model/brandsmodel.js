const mongoose = require('mongoose');

const brandSchema = mongoose.Schema({
    brandName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    list: {
        type: Boolean,
        required: true
    },
    image: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return typeof value === 'string' && value.trim().length > 0;
            },
            message: 'Image path is required.'
        }
    }
})


module.exports = mongoose.model("Brand", brandSchema, "Brand")