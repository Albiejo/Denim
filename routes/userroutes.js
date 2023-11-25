const express = require("express")
const path = require("path")
const session=require("express-session")
const user_route = express()
user_route.set("view engine", "ejs");
user_route.set("views", "./views/user")
const auth=require("../middleware/userAuth")

const userController = require("../controller/usercontroller")



user_route.use('/public', express.static("public"))
user_route.use('/static', express.static(path.join(__dirname, 'public')))
user_route.use('/js', express.static(path.join(__dirname, 'public/assets/js')))
user_route.use('/css', express.static(path.join(__dirname, 'public/assets/css')))

user_route.use(session({
    secret:'abc123',
    resave:false,
    saveUninitialized:false,
    cookie: { maxAge: 3600000 }
}))


user_route.get('/',userController.loadUserHome)
user_route.get('/loginhomepage' ,auth.isLogin, userController.loadloghomepage)
user_route.get('/registration' , auth.isLogout, userController.loadregi)
user_route.get('/login',auth.isLogout,userController.loadlogin)
user_route.post('/registration', userController.insertUser)

user_route.post('/login', userController.verifyUser)
user_route.get('/forgotPasswordVerify',userController.loadandverifyuser)
user_route.post('/forgotPasswordVerify' , userController.verifyOtpforgotpassword)
user_route.get('/setupnewpassword',userController.loadAndAddNewPassword)
user_route.post('/setupnewpassword',userController.updateUserPassword)

user_route.get('/userdashboard',auth.isLogin, userController.userdashboard)
user_route.get('/logout' ,auth.isLogin,userController.userLogout)
user_route.get('/otplogin' , auth.isLogout,userController.loadotplogin)
user_route.post('/send-otp' , userController.sendOtp)
user_route.post('/otplogin' , userController.verifyOtp)
user_route.get('/filter'  ,userController.Loadmenonly)
user_route.get('/productview',userController.checkingproduct)
user_route.post('/productview',userController.postUserReview)
user_route.get('/aboutus' ,auth.isLogin ,userController.Loadaboutpage)
user_route.get('/contactus' ,auth.isLogin ,userController.loadcontactpage)
user_route.get('/wishlist' ,auth.isLogin ,userController.loadWishlist)
user_route.get('/shopcart' ,auth.isLogin ,userController.loadshopcart)
user_route.post('/edit-user-address'  , userController.loadedituseraddress) 
user_route.post('/changepassword',auth.isLogin,userController.updatePassword)
user_route.post('/addnewaddress',auth.isLogin , userController.addnewaddress)
user_route.post('/addnewaddressfromcheckout',auth.isLogin , userController.addnewaddressfromcheckout)
user_route.get('/deleteaddress' , auth.isLogin,userController.deleteAddress)
user_route.get('/editprofileaddress',auth.isLogin,userController.loadeditprofileaddress)
user_route.get('/editprofileaddressfromcheckout',auth.isLogin,userController.loadeditprofileaddresstocheckout)
user_route.post('/updateuseraddress',userController.updateUserAddress)
user_route.post('/UpdateUserAddressFromCheckout',userController.updateUserAddressFromcheckout)
user_route.post('/addtocart' ,userController.addtocartitem)
user_route.post('/addtocartfromwishist' , userController.addtocartfromwishlist)
user_route.post('/deletecartitem' ,auth.isLogin, userController.deleteItemFromCart)
user_route.post('/updatecartquantity', userController.updateQuantity);
user_route.get('/usercheckout' ,auth.isLogin, userController.loadCheckoutPage)
user_route.post('/addtowishlist' , userController.addItemToWishlist)
user_route.get('/deletewishlistitem' , auth.isLogin , userController.deletewishlistItem)
user_route.post('/orderconfirm' , auth.isLogin , userController.confirmOrderDetails)
user_route.get('/orderconfirmation' , auth.isLogin , userController.loadOrderConfirmation)
user_route.get('/fullOrderDetails' , auth.isLogin , userController.loadFullOrderDetails)
user_route.get('/cancelOrder/:orderid' , auth.isLogin , userController.cancelOrder)
user_route.post('/validateCpass' , userController.validatePassChange)
user_route.post('/sendMessage' , auth.isLogin  , userController.loadsendmessage)
user_route.get('/search' , auth.isLogin , userController.loadSearchItems)
user_route.get("/sortproducts" , auth.isLogin , userController.sortProduts)
user_route.get('/cancelItem/:orderId/:itemId' , auth.isLogin , userController.deleteItems)
user_route.post('/requestReturn/:orderId' , userController.requestchange)
user_route.post('/returnitem/:orderid/:itemid' , auth.isLogin , userController.returnItem)
user_route.post('/verify-payment' , userController.loadverify)
user_route.post('/applyCoupon' , userController.applycoupon)
user_route.get('/categoryfilter',auth.isLogin , userController.loadCategoryFilter)
user_route.get('/removeFullItems' , auth.isLogin , userController.Removeallitems)
user_route.get('/addfullitemstocart' , auth.isLogin , userController.Addallitemstocart)
user_route.get('/clearCart' , auth.isLogin , userController.ClearCart)
user_route.get('/errorpage'  , userController.loadErrorPage)
user_route.get('/servererrorpage' , userController.loadserverErrorPage)
user_route.post('/postReview',userController.postUserReview)
user_route.get('/myOrders',userController.loadUserOrders)
user_route.get('/downloadInvoice',auth.isLogin, userController.downloadInvoice)

module.exports = user_route