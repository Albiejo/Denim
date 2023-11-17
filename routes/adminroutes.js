const express=require("express")
const multer = require('multer')
const path = require('path')
const admin_route=express()
admin_route.set("view engine" , "ejs")
admin_route.set("views" , "./views/admin")
const auth = require('../middleware/adminAuth')


// Set up Multer for handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'croppedimages'); // Set the destination folder for uploads
    },
    filename: function (req, file, cb) {
        // Generating a unique filename for the uploaded file
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// Set up Multer for handling admin banner file uploads
const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'BannerImages'); // Set the destination folder for uploads
    },
    filename: function (req, file, cb) {
        // Generating a unique filename for the uploaded file
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload2 = multer({ storage: storage2 });



const adminController=require("../controller/admincontroller")
admin_route.use(express.static("public"))
admin_route.use('/static', express.static(path.join(__dirname, 'public')))
admin_route.use('/js', express.static(path.join(__dirname, 'public/admin-assets/js')))
admin_route.use('/css', express.static(path.join(__dirname, 'public/admin-assets/css')))




admin_route.get('/login' ,auth.isLogout,adminController.loadAdminLogin)
admin_route.post('/login',adminController.verifyAdmin)

admin_route.get('/adminhome',auth.isLogin,adminController.loadAdminhome)
admin_route.get('/logout' ,auth.isLogin, adminController.adminLogout)


admin_route.get('/category',auth.isLogin,adminController.loadCategory)
admin_route.post('/category' , adminController.addCategory)
admin_route.get('/deleteCategory' , auth.isLogin,adminController.deleteCategory)
admin_route.get('/editcategory' ,auth.isLogin ,adminController.loadeditcategory)
admin_route.post('/editcategory' , adminController.savecategory)


admin_route.get('/brands' ,auth.isLogin ,adminController.Loadbrands)
admin_route.post('/brands' ,upload.single('image'),adminController.addBrand)
admin_route.get('/deletebrand' ,auth.isLogin,adminController.deleteBrand)
admin_route.get('/editBrand' , auth.isLogin,adminController.editBrand)
admin_route.post('/editBrand' ,upload.single('image') ,adminController.Savebrand)


admin_route.get('/products',auth.isLogin,adminController.loadProducts)
admin_route.post('/products',adminController.searchProductshere)

admin_route.get('/addproducts' ,auth.isLogin ,adminController.loadAddProducts)
admin_route.post('/addproducts' ,upload.array('image' , 3) ,adminController.Saveproducts)
admin_route.get("/deleteproduct",auth.isLogin,adminController.deleteproduct);
admin_route.get('/deleteproductimage' ,auth.isLogin,adminController.deleteImage)
admin_route.get('/editProduct' ,auth.isLogin,adminController.productEdit)
admin_route.post('/editProduct' ,upload.array('image' , 3),adminController.UpdateProduct)



admin_route.get('/users' , auth.isLogin,adminController.listUsers)
admin_route.get('/blockuser' ,auth.isLogin ,adminController.Blockuser)
admin_route.get('/unblockuser' ,auth.isLogin ,adminController.Unblockuser)


admin_route.get('/userOrders' ,auth.isLogin ,adminController.loadOrders )
admin_route.get('/editUserorder' ,auth.isLogin ,adminController.loadorderEdit)

admin_route.post('/updateUserOrder' , adminController.changeOrderStatus)
admin_route.get('/approvereturn' , auth.isLogin , adminController.acceptRequest)
admin_route.get('/rejectreturn' , auth.isLogin , adminController.rejectRequest)
admin_route.get('/approveitemreturn' , auth.isLogin , adminController.acceptitemrequest)
admin_route.get('/rejectitemreturn' , auth.isLogin , adminController.Rejectitemrequest)
admin_route.get('/coupons' , auth.isLogin ,adminController.loadCoupons )
admin_route.post('/coupons' , adminController.addCoupons)
admin_route.get('/editCoupon' , auth.isLogin , adminController.loadcouponEdit)
admin_route.post('/editCoupon' , auth.isLogin , adminController.updateCoupon)
admin_route.get('/deleteCoupon' ,auth.isLogin, adminController.deletecoupon)
admin_route.get('/banner',auth.isLogin , adminController.loadBanner)
admin_route.post('/banner' , upload2.single('image') , adminController.AddBanner)
admin_route.get('/deleteBanner' , auth.isLogin , adminController.DeleteBanner)
admin_route.post('/updatestatus' , adminController.changestatus)


admin_route.get('/salesreport' , auth.isLogin , adminController.loadSales)
admin_route.post('/salesreport' , adminController.loadcustomreport)

admin_route.post('/filterSales', adminController.loadDateReport)
admin_route.post('/fetchData/:time' , adminController.fetchDataGraph)
admin_route.get('/getreport',auth.isLogin,adminController.downloadSalesReport)
admin_route.get('/error',auth.isLogin,adminController.loadadminerror)


module.exports=admin_route