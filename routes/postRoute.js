import express from 'express'
import { protectedRoute } from '../middleware/authMiddleware.js'
import multer from 'multer'
import path from 'path'
import User from '../models/userModel.js'
import Post from '../models/postModel.js'
import { unlink } from 'fs'

const router = express.Router()

//set up storage engine using multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
//Initialize upload variable with the storage
const upload = multer({ storage: storage })

//route for posts page
router.get('/posts', protectedRoute, async (req, res) => {
    try {

        const userId = req.session.user._id
        const user = await User.findById(userId).populate('posts')

        if (!user) {
            req.flash('error', 'User not found, try again!');
            return res.redirect('/')
        }

        return res.render('posts/index', {
            title: 'Post Page',
            active: 'posts',
            posts: user.posts
        })

    } catch (error) {
        console.error(error)
        req.flash('error', 'An error occurred while fetching your posts, try again!');
        return res.redirect('/posts')
    }
})

//Route for get posts page
router.get('/create-post', protectedRoute, (req, res) => {
    return res.render('posts/create-post', { title: 'Create Post Page', active: 'create_post' })
})

//Route for edit posts page
router.get('/edit-post/:id', protectedRoute, async (req, res) => {
    try {
        const postId = req.params.id
        const post = await Post.findById(postId)

        if (!post) {
            req.flash('error', 'Something went wrong, try again!')
            return res.redirect('/posts')
        }

        return res.render('posts/edit-post', { title: 'Edit Post Page', active: 'edit_post', post })

    } catch (error) {
        console.error(error)
        req.flash('error', 'Something went wrong, try again!')
        return res.redirect('/posts')
    }

})

//Route for edit posts page
router.get('/post/:slug', async (req, res) => {
    try {
        const slug = req.params.slug
        const post = await Post.findOne({ slug }).populate('user')

        if (!post) {
            req.flash('error', 'Post onot found!')
            return res.redirect('/posts')
        }

        return res.render('posts/view-post', { title: 'View Post Page', active: 'view_post', post })
        
    } catch (error) {
        console.error(error)
        req.flash('error', 'Something went wrong, try again!')
        return res.redirect('/posts')
    }

})

//Handle Route for update posts page
router.post('/update-post/:id', protectedRoute, upload.single('image'), async (req, res) => {
    try {
        const postId = req.params.id
        const post = await Post.findById(postId)

        if (!post) {
            req.flash('error', 'Something went wrong, try again!')
            return res.redirect('/posts')
        }

        post.title = req.body.title
        post.content = req.body.content
        post.slug = req.body.title.replace(/\s+/g, '_').toLowerCase()

        if (req.file) {
            unlink(path.join(process.cwd(), 'uploads') + '/' + post.image, (err) => {
                if (err) {
                    console.error(err)
                }
            })
            post.image = req.file.filename
        }
        await post.save()
        req.flash('success', 'Post updated successfully!')
        return res.redirect('/posts')

    } catch (error) {
        console.error(error)
        req.flash('error', 'Something went wrong, try again!')
        return res.redirect('/posts')
    }
})

//Handle Route for create posts page
router.post('/create-post', protectedRoute, upload.single('image'), async (req, res) => {
    // req.file is the `image` file
    try {
        const { title, content } = req.body
        const image = req.file.filename
        const slug = title.replace(/\s+/g, '_').toLowerCase()

        const user = await User.findById(req.session.user._id)

        //create new post
        const post = new Post({ title, slug, content, image, user })

        //Save model to MongoDb
        await User.updateOne({ _id: req.session.user._id }, { $push: { posts: post._id } })

        await post.save()
        req.flash('success', 'Post created successfully!')
        return res.redirect('/posts')

    } catch (error) {
        console.error(error)
        req.flash('error', 'Something went wrong, try again!')
        return res.redirect('/create-post')
    }

})

//Handle Route for delet posts page
router.post('/delete-post/:id', protectedRoute, async (req, res) => {
    try {
        const postId = req.params.id
        const post = await Post.findById(postId)

        if (!post) {
            req.flash('error', 'Something went wrong, try again!')
            return res.redirect('/posts')
        }

        await User.updateOne({ _id: req.session.user._id }, { $pull: { posts: postId } })
        await Post.deleteOne({ _id: postId })

        unlink(path.join(process.cwd(), 'uploads') + '/' + post.image, (err) => {
            if (err) {
                console.error(err)
            }
        })

        req.flash('success', 'Post deleted successfully!')
        return res.redirect('/posts')

    } catch (error) {
        console.error(error)
        req.flash('error', 'Something went wrong, try again!')
        return res.redirect('/posts')
    }
})

export default router