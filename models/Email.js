const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    emailAddress: { 
        type: String, 
        required: true 
    }
});

Email = mongoose.model('Email', emailSchema);
module.exports = Email
