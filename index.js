import express from 'express'
import connectMongoDB from './config/db.js'
import authRoute from './routes/authRoute.js'
import postRoute from './routes/postRoute.js'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import flash from 'connect-flash'
import path from 'path'

const app = express()

const port = process.env.PORT || 8080

//Connect to MongoDB Database
connectMongoDB()

//Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
//Make uploads directory as static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

//Cookie middleware
app.use(cookieParser(process.env.COOKIE_SECRET))

//Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000 * 60 * 24 * 7 //1 week
    }
}))

//flash message middleware
app.use(flash())

//Store flash message for views
app.use(function (req, res, next) {
    res.locals.message = req.flash()
    next()
})

//Store authenticated user's session data for view
app.use((req, res, next) => {
    res.locals.user = req.session.user || null
    next()
})

//Set view engin & Embedded JavaScript templates
app.set('view engine', 'ejs')

//Route for the Home page: http://localhost/3000
app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page', active: 'home' })
})

//auth router
app.use('/', authRoute)
//post router
app.use('/', postRoute)

app.listen(port, () => {
    console.log(`SERVER is running on http://localhost:${port}`)
})