const mongoose = require('mongoose');


const contentSchema = mongoose.Schema({
    user : {type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    },
    date : {
        type : Date,
        default : Date.now
    },

    title : String,
    content : String,
  

})

module.exports = mongoose.model('content',contentSchema);