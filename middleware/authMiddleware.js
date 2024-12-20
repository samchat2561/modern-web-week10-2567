export const protectedRoute = function (req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    next()
}

export const guestRoute = function(req,res,next){
    if(req.session.user){
        return res.redirect('/profile')
    }
    next()
}