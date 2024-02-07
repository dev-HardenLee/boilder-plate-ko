const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { User } = require('./models/User')
const { auth } = require('./middleware/auth')

const config = require('./config/key')

// aplication/x-www-roem-urlencoded
app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser())

// aplication/json
app.use(bodyParser.json())

const mongoose = require('mongoose')

mongoose.connect(config.mongoURI)
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Hello World! ~ 안녕하세요. !')
})

app.post('/api/users/register', async (req, res) => {
    // 회원 가입 할 때 필요한 정보들을 client에서 가져오면 
    // 그것들을 데이터 베이스에 넣어준다.

    const user = new User(req.body)

    try {
        await user.save()
    } catch (err) {
        console.log(err)

        return res.json({
            success: false, 
            err
        })
    }

    return res.status(200).json({
        success: true
    })
})

app.post('/api/users/login', async (req, res) => {
    try {
        const query = User.where({ email: req.body.email });
        const user = await query.findOne();
        

        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({loginSuccess: false, message: '비밀번호가 틀렸습니다.'})

            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err)

                return res
                    .cookie('x_auth', user.token)
                    .status(200)
                    .json({loginSuccess: true, userId: user._id})
            })// generateToken
        })// comparePassword
    }catch (err) {
        console.log(err)
        return res.json({
            loginSuccess: false,
            message: '제공된 이메일에 해당하는 유저가 없습니다.'
        })
    }// try-catch
})

app.get('/api/users/auth', auth, (req, res) => {
    // 여기까지 middleware를 통과했다는 것은
    // Authentication이 true이다.

    return res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })
})

app.get('/api/users/logout', auth, async (req, res) => {
    try {
        await User.findOneAndUpdate({_id: req.user._id}, {token: ''})

        return res.status(200).send({success: true})
    } catch (err) {
        return res.json({success: false, err})
    }// try-catch

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})