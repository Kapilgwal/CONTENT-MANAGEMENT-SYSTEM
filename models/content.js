const mongoose = require('mongoose');


const contentSchema = mongoose.Schema({
    user : {type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    },
    date : {
        type : Date,
        default : Date.now
    },
    username : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },
    title : String,
    content : String,

    likes : [
        {type : mongoose.Schema.Types.ObjectId, ref: "user"}
    ]
  

})

module.exports = mongoose.model('content',contentSchema);