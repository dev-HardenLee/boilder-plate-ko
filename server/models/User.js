const mongoose = require('mongoose')

const bcrypt = require('bcrypt')
const saltRounds = 10
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        maxlength: 100
    },
    lastname : {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: {
        type: String
    },
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

userSchema.pre('save', function ( next ) {
    const user = this;
    
    if(user.isModified('password')) {
        bcrypt.genSalt(saltRounds, function(err, salt) {
            if(err) return next(err)
    
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return next(err)
    
                user.password = hash
    
                next()
            });
        });
    } else {
        next()
    }
})

userSchema.methods.comparePassword = function (plainPassword, callBack) {
    bcrypt.compare(plainPassword, this.password, function(err, isMatch) {
        if(err) return callBack(err)

        callBack(null, isMatch)
    })
}// comparePassword

userSchema.methods.generateToken = async function (callBack) {
    const user = this

    const token = jwt.sign(user._id.toHexString(), 'secretToken')

    user.token = token

    try {
        await user.save()
    } catch (err) {
        callBack(err)
    }

    callBack(null, user)
}

userSchema.statics.findByToken = function (token, callBack) {
    const user = this

    // 토큰을 decode한다.
    jwt.verify(token, 'secretToken', async function(err, decoded) {
        try {
            const query = User.where({ '_id': decoded, token });
            const user = await query.findOne();

            callBack(null, user)
        } catch (err) {
            return callBack(err)
        }
        

    })
}

const User = mongoose.model('User', userSchema)

module.exports = {
    User
}