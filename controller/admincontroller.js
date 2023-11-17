const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const ejs = require('ejs');
const Admin    = require('../model/adminmodel')
const Category = require('../model/categoryModel')
const Brand    = require('../model/brandsmodel')
const bcrypt   = require('bcrypt');
const Product  = require('../model/productModel')
const Users    = require('../model/userModel')
const Order    = require('../model/orderModel')
const Coupon   = require('../model/CouponModel')
const Banner   = require('../model/BannerModel')
const sharp = require('sharp')
const path = require('path')
const ITEMS_PER_PAGE = 8;

//loading admin login page 
const loadAdminLogin = async (req, res) => {
    try {

        if (req.session.admin_id) {
            return res.redirect('/admin/adminhome')
        } else {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.render('adminlogin')
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



//verifying admin credentials through login page 
const verifyAdmin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
      
        const adminData = await Admin.findOne({ email: email });
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password)
            if (passwordMatch) {
                if (adminData.is_admin) {
                    res.setHeader('cache-control', 'no-cache,no-store,must-revalidate');
                    req.session.admin_id = adminData._id;

                    return res.redirect('/admin/adminhome')
                }
                else {
                    res.status(404).render('adminerror' , {message:"404: page not found !"}); 
                }
            }
            else {
                res.render('adminlogin', { message: "Invalid password !! try again " })
            }
        }

        else {
            console.log("invalid email");
            return res.render('adminlogin', { message: "Invalid email !! try again.." })
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
        }
}

function generateRandomToken() {
    return 'denimstore';
}



//loading admin dashboard page 
const loadAdminhome = async (req, res) => {
    try {
        const adminData = await Admin.findById({ _id: req.session.admin_id });
        const deliveredOrder = await Order.find({status:"Delivered"})
        const ordercount = await Order.countDocuments()
        const productCount = await Product.countDocuments()
        const categoryCount = await Category.countDocuments()
        let revenue=0
        for(let i=0; i< deliveredOrder.length; i++){
            revenue = revenue+deliveredOrder[i].totalAmount            
        }
        if (adminData) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.render('adminhome' , {revenue:revenue,productCount:productCount ,ordercount:ordercount , categoryCount:categoryCount})
        }
        else {
            res.redirect('/admin/login')
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}




//loading prodcuts view 
const loadProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = ITEMS_PER_PAGE;
  
    try {

      // Fetch total count of products
      const totalProductsCount = await Product.countDocuments({});
      // Fetch products for the current page
      const productData = await Product.find({})
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      const totalPages = Math.ceil(totalProductsCount / itemsPerPage);
  
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.render('products_overview', {
        productData: productData,
        currentPage: page,
        totalPages: totalPages
      });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



const searchProductshere = async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    try {
        
        const searchQuery = req.body.Searchquery
        const totalProducts = await Product.countDocuments({
            $or: [
              { productName: { $regex: new RegExp(searchQuery, "i") } }, { Discription: { $regex: new RegExp(searchQuery, "i") } },
              { category: { $regex: new RegExp(searchQuery, "i") } },
              { brand: { $regex: new RegExp(searchQuery, "i") } },
              {gender:{ $regex: new RegExp(searchQuery, "i") }}
            ],
          });
          const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
          const searchResults = await Product.find({
            $or: [
              { productName: { $regex: new RegExp(searchQuery, "i") } }, { Discription: { $regex: new RegExp(searchQuery, "i") } },
              { category: { $regex: new RegExp(searchQuery, "i") } },
              { brand: { $regex: new RegExp(searchQuery, "i") } },
              {gender:{ $regex: new RegExp(searchQuery, "i") }}
            ],
          })
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
            if (searchResults.length > 0) {
                res.render("products_overview", {
                    productData: searchResults,
                  currentPage: page,
                  totalPages: totalPages,
                });
              } else {
                res.render("products_overview", {
                    productData: searchResults,
                  currentPage: page,
                  totalPages: totalPages,
                  message: "Sorry, no items for your search !",
                });
              }
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"});
    }
}



//loading category 
const loadCategory = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = ITEMS_PER_PAGE;
    try {
        const totalcategoryCount = await Category.countDocuments({});
        const categoryList = await Category.find({}).skip((page - 1) * itemsPerPage).limit(itemsPerPage);
        const totalPages = Math.ceil(totalcategoryCount / itemsPerPage);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.render('category_products', { categoryList: categoryList,currentPage: page,
            totalPages: totalPages })
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}





// adding category to database 
const addCategory = async (req, res) => {
    try {
        const newCategory = req.body.categoryName.trim().toLowerCase(); // Convert to lowercase
        const categoryList = await Category.find({});
        const checkName = await Category.findOne({ categoryName: newCategory });

        if (checkName) {
          return   res.render("category_products", { message: "Sorry, category already exists with this name", categoryList: categoryList });
        } 
        else {
            const category = new Category({
                categoryName: newCategory,
                list: 1
            });

            const addSuccess = await category.save();
            if (addSuccess) {
                res.redirect("/admin/category");
            } else {
                res.render("category_products", { message: "Something went wrong , please try again", categoryList: categoryList });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
        }
};





//deleting category 
const deleteCategory = async (req, res) => {
    try {
        const id = req.query.id
        await Category.deleteOne({ _id: id })
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}


//editing categrory 
const loadeditcategory = async (req, res) => {
    try {
        const id = req.query.id
        const Data = await Category.findOne({ _id: id })
        if (Data) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.render("editCategory", { data: Data })
        } else {
            res.redirect('/admin/category')
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}


//savecategory
const savecategory = async (req, res) => {
    try {
        const updatedCategoryName = req.body.categoryName.trim();
        const existingCategory = await Category.findOne({ categoryName: updatedCategoryName });

        if (!updatedCategoryName) {
            return res.render("editCategory", { message: "Name cannot be empty", data: Data });
        } else if (!/^[a-zA-Z\s]+$/.test(updatedCategoryName)) {
            return res.render("editCategory", { message: "Name cannot contain numbers and spaces", data: Data });
        } else if (existingCategory && existingCategory._id != req.body.categoryId) {
            return res.render("editCategory", { message: "Category name already exists. Please choose a different name.", data: Data });
        }

        // If all validation checks pass, update the category with the original case
        const updatedCategory = await Category.findByIdAndUpdate(
            { _id: req.body.categoryId },
            { $set: { categoryName: req.body.categoryName, list: req.body.status } }
        );

        if (updatedCategory) {
            console.log("Data updated");
            return res.redirect('/admin/category');
        } else {
            // Handle the case where the update was not successful (if needed)
            console.log("Update failed");
            return res.status(500).send("Internal Server Error");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
        }
};






//loading brands page 
const Loadbrands = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = ITEMS_PER_PAGE;
    try {
        const totalbrandCount = await Brand.countDocuments({});
        const brandData = await Brand.find({}).skip((page - 1) * itemsPerPage).limit(itemsPerPage);
        const totalPages = Math.ceil(totalbrandCount / itemsPerPage);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.render('brandView', { brandData: brandData ,currentPage: page,
            totalPages: totalPages})
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}


//adding brand to database 
const addBrand = async (req, res) => {
    let brandData; // Declare brandData here

    try {
        const newbrand = req.body.brand_name;
        const Discription = req.body.brand_description;
        const Imagefile = req.file ? req.file.filename : null; // Check if req.file is available

        // Load brandData before the operation
        brandData = await Brand.find({});

        const brandExists = await Brand.findOne({ brandName: newbrand });
        if (brandExists) {
            return res.render("brandView", { message: "Hey Admin, This brand already exists.", brandData: brandData });
        }

        if (!newbrand) {
            return res.render("brandView", { message: "Hey Admin , Brand name is required.", brandData: brandData });
        }

        if (!Discription) {
            return res.render("brandView", { message: "Hey Admin, Brand description is required.", brandData: brandData });
        }

        if (!Imagefile) {
            return res.render("brandView", { message: "Hey Admin , Image is required.", brandData: brandData });
        }

        const brandd = new Brand({
            brandName: newbrand,
            description: Discription,
            list: 1,
            image: Imagefile
        });

        const addSuccess = await brandd.save();
        if (addSuccess) {
            brandData = await Brand.find({}); // Update brandData after adding a new brand
            res.redirect('/admin/brands');
        } else {
            console.log("Error saving brand to the database.");
            res.render("brandView", { message: "Something went wrong", brandData: brandData });
        }
    } catch (error) {
        console.log("Error in addBrand function:", error.message);
        brandData = brandData || [];
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"});     }
}




//deleting a brand 
const deleteBrand = async (req, res) => {

    try {
        const id = req.query.id
        await Brand.deleteOne({ _id: id })
        res.redirect('/admin/brands')
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }


}



//editing brand details
const editBrand = async (req, res) => {

    try {
        const id = req.query.id
        const data = await Brand.findOne({ _id: id })
        if (data) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.render("editBrand", { data: data })
        }
        else {
            res.redirect('/admin/editBrand')
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



//saving new brand details to the database
const Savebrand = async (req, res) => {
    try {
        const updateFields = {
            brandName: req.body.brand_name,
            description: req.body.brand_description,
            list: req.body.status,
        };

        // Check if a file is uploaded
        if (req.file) {
            // Assuming the file is saved in the 'uploads' folder
            updateFields.image = req.file.filename;
        }

        const newBrand = await Brand.findByIdAndUpdate(
            { _id: req.body.Brandid },
            { $set: updateFields },
            { new: true } // Return the updated document
        );

        if (newBrand) {
            res.redirect('/admin/brands');
        } else {
            console.log("Data not updated...");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}






// loading add products

const loadAddProducts = async (req, res) => {
    try {
        const brandData = await Brand.find({})
        const categoryData = await Category.find({})
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.render('addProducts', { brandData: brandData, categoryData: categoryData })
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



//saving products in database
const Saveproducts = async (req, res) => {
    try {
        
        const brandData = await Brand.find({});
        const categoryData = await Category.find({});

        const Images = req.files.map(file => ({ url: file.filename }));
        const { product_name, discription, Size, brandSelect, categorySelect, regprice, offerprice, stock, gender } = req.body;
        
        if(!product_name || !discription || !Size || !brandSelect || !categorySelect || !regprice || !offerprice || !stock || !gender){
            res.render('addProducts', { brandData: brandData, categoryData: categoryData , message:"some fields are missing , check again!" })
        }

        const ProductInstance = new Product({
            productName: product_name,
            Discription: discription,
            size: Size.split(',').map(s => s.trim()), // Split sizes and trim whitespace
            brand: brandSelect,
            category: categorySelect,
            regularPrice: regprice,
            offerPrice: offerprice,
            images: [],
            stock: stock,
            list: 1,
            gender: gender
        });

        for (let file of req.files) {
            
            const randomInteger = Math.floor(Math.random() * 20000001)
            const imageDirectory = path.join(__dirname,"/croppedimages")
            let imgFileName = "cropped" + randomInteger + ".jpg"
            let imagePath = path.join(imageDirectory, imgFileName)
            
            const croppedImage = await sharp(file.path)
                .resize(1000, 1000, {
                    fit: "fill",
                })
                .toFile(imagePath)
            if (croppedImage) {
                let imgObj={
                    url:imgFileName
                }
                ProductInstance.images.push(imgObj)
            }
        }

        const addSuccess = await ProductInstance.save();
        if (addSuccess) {
            console.log("Product added successfully");
            return res.redirect('/admin/products');
        } else {
             console.log("Error saving product to the database.");
             res.status(400).render('adminerror' , {message:"400: Bad request !"}); 
        }
    } catch (error) {
        console.log("Internal server error please try again...:", error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
};




const deleteproduct = async (req, res) => {
    try {
        const id = req.query.id
        const newProduct = await Product.findByIdAndUpdate({ _id: id }, { $set: { list: 0 } })
        if (newProduct) {
            res.redirect('/admin/products');
        } else {
            console.log("Data not updated...");
            res.status(400).render('adminerror' , {message:"400: Bad request !"}); 
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}




const productEdit = async (req, res) => {
    try {
        const brandData = await Brand.find({})
        const categoryData = await Category.find({})
        const id = req.query.id
        const data = await Product.findOne({ _id: id })
        if (data) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.render("EditProducts", { data: data, brandData: brandData, categoryData: categoryData })
        }
        else {
            res.redirect('/admin/products')
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}






const UpdateProduct = async (req, res) => {

    try {
        const brandData = await Brand.find({});
        const categoryData = await Category.find({});
        const Images = req.files.map(file => {
            return { url: file.filename }
        });
        const file = await Product.findOne({ _id: req.body.Productid })


        const { product_name, discription,  Size, brandSelect, categorySelect, regprice, offerprice, stock, gender, status } = req.body;

        console.log("reached body of product update")
        const updateFields = {
            productName: product_name,
            Discription: discription,
            size: Size.split(',').map(s => s.trim()), // Split sizes and trim whitespace
            brand: brandSelect,
            category: categorySelect,
            regularPrice: regprice,
            offerPrice: offerprice,
            images: [],
            images: [...file.images, ...Images],
            stock: stock,
            list: status,
            gender: gender
        }
        for (let file of req.files) {
            
            const randomInteger = Math.floor(Math.random() * 20000001)
            const imageDirectory = "/croppedimages"
            let imgFileName = "cropped" + randomInteger + ".jpg"
            let imagePath = path.join(imageDirectory, imgFileName)
            const croppedImage = await sharp(file.path)
                .resize(1000, 1000, {
                    fit: "fill",
                })
                .toFile(imagePath)
            if (croppedImage) {
                let imgObj={
                    url:imgFileName
                }
                updateFields.images.push(imgObj)
            }
        }
        const addSuccess = await Product.findByIdAndUpdate(
            { _id: req.body.Productid },
            { $set: updateFields },
            { new: true } // Return the updated document
        );
        if (addSuccess) {
            console.log("Product Updated successfully");
            return res.redirect('/admin/products');
        } else {
            console.log("Error updating product to the database.");
            // Handle the error, e.g., render an error page
            return res.status(500).render("errorPage", { message: "Error updating product to the database." });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
};



const adminLogout = async (req, res) => {
    try {
        // Destroy the session
        req.session.destroy(err => {
            if (err) {
                console.log("Error destroying session:", err.message);
            } else {
                // Redirect to the login page after successful session destruction
                res.redirect('/admin/login');
            }
        });
    } catch (error) {
        console.log("Error during logout:", error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
        }
}






const listUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = ITEMS_PER_PAGE;
    try {
        const totalusersCount = await Users.countDocuments({});
        const usersData = await Users.find({}).skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      const totalPages = Math.ceil(totalusersCount / itemsPerPage);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.render('listusers', { usersData: usersData ,currentPage: page,
            totalPages: totalPages})
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



// const Blockuser = async (req, res) => {
//     try {
//         const id = req.query.id
//         const data = await Users.findByIdAndUpdate({ _id: id }, { $set: { list: 0 } })
//         if (data) {
//             res.redirect('/admin/users')
//         } else {
//             console.log(("error in updating user status...."));
//             res.status(400).render('adminerror' , {message:"400: Bad request !"}); 
//         }
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
//     }
// }





const Blockuser = async (req, res) => {
    try {
      const id = req.query.id;
 

      const user = await Users.findById(id);
      if (user) {
        user.list = 0;
        await user.save();
        req.session.user_id=undefined;
        res.redirect('/admin/users')

      } else {
        console.log("User not found");
        res.status(400).render('adminerror', { message: "400: Bad request !" });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).render('adminerror', { message: "500: Internal Server Error...please try after sometime" });
    }
  };
  





const Unblockuser = async (req, res) => {
    try {
        const id = req.query.id
        const data = await Users.findByIdAndUpdate({ _id: id }, { $set: { list: 1 } })
        if (data) {
            res.redirect('/admin/users')
        } else {
            console.log(("error in updating user status...."));
            res.status(400).render('adminerror' , {message:"400: Bad request !"}); 
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



//deleting image from edit product page 
const deleteImage = async (req, res) => {
    try {
        console.log("inside delete function ");
        const imageid = req.query.imageid;
        const productId = req.query.productId

        const update = await Product.updateOne({ _id: productId }, { $pull: { images: { _id: imageid } } });
        if(update){
            res.redirect(`/admin/editProduct/?id=${productId}`);
        }else{
            console.log(error.message)
            res.status(400).render('adminerror' , {message:"400: Bad request ! try again"}); 
        }
       
    } catch (error) {
        console.log("Internal server error please try again...:", error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"});
    }
}




const loadOrders = async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = ITEMS_PER_PAGE;
    try {
        const totalorderCount = await Order.countDocuments({});
        const orderData = await Order.find({}).populate('customerId').skip((page - 1) * itemsPerPage).limit(itemsPerPage);
        const totalPages = Math.ceil(totalorderCount / itemsPerPage);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.render('Orders' , {orderData:orderData , currentPage: page,
            totalPages: totalPages})
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}




const loadorderEdit =async(req,res)=>{
    try {
        const orderId=req.query.orderid
        const order = await Order.findOne({ _id: orderId })
        const Orderr=await Order.findOne({_id:orderId}).populate('Items.productId')
        const productData= Orderr.Items.map((item)=>{return item.productId})
        const addressData = order.Address


        res.render('Orderedit', {Orderr:Orderr , productData:productData , addressData:addressData , items:Orderr.Items})
        
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



const changeOrderStatus = async(req,res)=>{
    try { 
        
        const orderid=req.body.id
        const statusValue=req.body.orderStatusOption
        console.log(orderid)
        console.log(statusValue)
        const update = await Order.updateOne({_id:orderid} , {$set:{status:statusValue , deliveredOn:"nill"}})
        const orderdata = await Order.findOne({ _id: orderid });
        const date = new Date();
        if(update){
        for (let i = 0; i < orderdata.Items.length; i++) {
            orderdata.Items[i].status=statusValue;
           
        }
        await orderdata.save();
         }


        if(update){
            console.log("status updated")
            if (statusValue === "Cancelled") {
                // Fetch the order details
                if (orderdata) {
                  // For each item in the order, add stock back to the product
                  for (let i = 0; i < orderdata.Items.length; i++) {
                    const productId = orderdata.Items[i].productId;
                    const quantity = orderdata.Items[i].quantity;
                    const product = await Product.findById(productId);
                    if (product) {
                      product.stock += quantity;
                      await product.save();
                      console.log("Stock added back for product ID: " + productId);
                    }
                  }
                }
              }

              if(statusValue === "Delivered"){
                const update = await Order.updateOne({_id:orderid} , {$set:{status:statusValue , deliveredOn:date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear()}})
              }
        }  
        else{
            console.log("status updation failed")
            res.status(400).render('adminerror' , {message:"400: Bad request ! try again"}); 
        }  
        res.redirect('/admin/userOrders')
       
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}


const acceptRequest =async(req,res)=>{
    try {

        const user=await Users.findOne({_id:req.session.user_id})
        const orderid=req.query.orderid
        const order= await Order.findOne({_id:orderid})
        const update=await Order.updateOne({_id:orderid} , {$set:{returnStatus:"Request Accepted" , return:false}})
        await order.save() ;
        console.log("admin changed status")
        if(update){
            for (let i = 0; i < order.Items.length; i++) {
                order.Items[i].returnStatus="Request Accepted";
                order.Items[i].return=false;
              
                
            }
            await order.save();
       
            //for inserting stock back while cancelling order
            for (let i = 0; i < order.Items.length; i++) {
                let productId = order.Items[i].productId
                let product = await Product.findById(productId)
                product.stock = product.stock + order.Items[i].quantity
                await product.save()
                console.log("return approved and items restocked successfully");
            }

            if(order.paymentMethod==="Razorpay"){
               
                    user.wallet = user.wallet + order.totalAmount;
                    user.transactionDetails.push({
                        transactionType:"Credit",
                        transactionAmount:order.totalAmount,
                        transactionDate:new Date(),
                        orderId:order.orderId
                    })
                    await user.save()
                  
           
        }
        res.redirect(`/admin/editUserorder?orderid=${orderid}`);
    }
        
        else{
           res.status(400).json({message:"couldn't complete operation. Please try again."})
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}




const rejectRequest = async(req,res)=>{
    try {
        const orderid=req.query.orderid
        const order= await Order.findOne({_id:orderid})
        const update=await Order.updateOne({_id:orderid} , {$set:{returnStatus:"Request Rejected" , return:false}})
        await order.save();
        if(update){
            for (let i = 0; i < order.Items.length; i++) {
                order.Items[i].returnStatus="Request Rejected";
                order.Items[i].return=false;
            }
            await order.save();
            res.redirect(`/admin/editUserorder?orderid=${orderid}`);
        } else{
           res.status(400).json({message:"couldn't complete operation. Please try again."})
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



const acceptitemrequest = async(req,res)=>{
    try {
        const orderid=req.query.orderid
        const itemid =req.query.itemid
        const order= await Order.findOne({_id:orderid})
        const orderItem = order.Items.id(itemid);

        if (!orderItem) {
            console.log("Order item not found");
        } else {
            orderItem.return = false;
            orderItem.returnStatus = "Request Accepted";
            order.save()
            let productId = orderItem.productId
            let product = await Product.findById(productId)
            product.stock = product.stock + orderItem.quantity
            await product.save()
            
            console.log("return approved and item restocked successfully");
            res.redirect(`/admin/editUserorder?orderid=${orderid}`);
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



const Rejectitemrequest = async(req,res)=>{
    try {
        
        const orderid=req.query.orderid
        const itemid =req.query.itemid
        const order= await Order.findOne({_id:orderid})
        const orderItem = order.Items.id(itemid);
        if (!orderItem) {
            console.log("Order item not found");
        } else {
            orderItem.return = false;
            orderItem.returnStatus = "Request Rejected";
            order.save()
            console.log("return rejected by admin");
            res.redirect(`/admin/editUserorder?orderid=${orderid}`);
        }

    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}


const loadCoupons = async(req,res)=>{
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = ITEMS_PER_PAGE;
    try {
        const totalcouponCount = await Coupon.countDocuments({});
        const totalPages = Math.ceil(totalcouponCount / itemsPerPage);
        const couponData = await Coupon.find({}).skip((page - 1) * itemsPerPage).limit(itemsPerPage);
        res.render('coupons' , {couponData:couponData , currentPage: page,
            totalPages: totalPages})
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}




const addCoupons = async(req,res)=>{
    try {
        const couponcode = req.body.couponcode
        const couponDiscription = req.body.coupondiscription
        const discount = req.body.Discount
        const MazimumAmount = req.body.MazimumAmount
        const MinimumAmount = req.body.MinimumAmount
        const couponexpiry = req.body.couponexpiry

        const coupon= new Coupon({
            minimumAmount:MinimumAmount,
            maximumAmount:MazimumAmount,
            Discription:couponDiscription,
            Expiry:couponexpiry,
            Code:couponcode,
            Discount:discount
        })

        const success = await coupon.save();
        if (success) {
            couponData = await Coupon.find({}); 
            res.redirect('/admin/coupons');
        } else {
            console.log("Error saving coupon to the database.");
            res.status(400).render('adminerror' , {message:"400: couldn't complete operation. Please try again. !"}); 
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}




const loadcouponEdit = async(req,res)=>{
    try {
        const id=req.query.id
        const couponData = await Coupon.findById(id);
        res.render('editCoupon' , {couponData:couponData})
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}





const updateCoupon = async(req,res)=>{
    try {
        
        const id =req.body.couponid
        const couponcode = req.body.couponcode
        const couponDiscription = req.body.coupondiscription
        const discount = req.body.Discount
        const MazimumAmount = req.body.MazimumAmount
        const MinimumAmount = req.body.MinimumAmount
        const couponexpiry = req.body.couponexpiry


        const success = await Coupon.updateOne({_id:id} , { minimumAmount:MinimumAmount,
            maximumAmount:MazimumAmount,
            Discription:couponDiscription,
            Expiry:couponexpiry,
            Code:couponcode,
            Discount:discount})
        if (success) {
            res.redirect('/admin/coupons');
        } else {
          console.log("Error updating coupon to the database.");
          res.status(400).render('adminerror' , {message:"400: couldn't complete operation. Please try again. !"}); 
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}





const deletecoupon = async(req,res)=>{
    try {
        const id=req.query.id
        const success = await Coupon.deleteOne({_id:id})
        if(success){
            console.log("coupon deleted")
            res.redirect('/admin/coupons');
        }else{
            console.log("couldnt delete coupon");
            res.status(400).render('adminerror' , {message:"400: couldn't complete operation. Please try again. !"}); 
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



const loadBanner = async(req,res)=>{
    try {
        const bannerData = await Banner.find({})
        res.render('Banner' , {bannerData:bannerData})
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



const AddBanner = async(req,res)=>{
    try {
       const discription = req.body.discription
       const Imagefile = req.file ? req.file.filename : null;
       const h1 = req.body.h1
       const h2 = req.body.h2
       const h3 = req.body.h3
       const p1 = req.body.p1

       const banner = new Banner({
        Discription:discription,
        status:1,
        Image:Imagefile,
        h1:h1,
        h2:h2,
        h3:h3,
        p1:p1
       })

       const result =  await banner.save()
       if(result){
        console.log("banner updated")
        res.redirect('/admin/banner')
       }else{
        res.status(400).render('adminerror' , {message:"400: couldn't complete operation. Please try again. !"}); 
       }
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}


const DeleteBanner = async(req,res)=>{
    try {

        const id = req.query.id
        const update = await Banner.deleteOne({_id:id})
        if(update){
            res.redirect('/admin/banner')
        }else{
            res.status(400).render('adminerror' , {message:"400: couldn't complete operation !"}); 
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}


const changestatus = async(req,res)=>{
    try {
        const _id = req.body._id; 
        let bannerData = await Banner.findById(_id)

        if (!bannerData) {
            return res.status(404).json({ error: "Banner not found" });
        }

        const newStatus = bannerData.status ? 0 : 1;
        bannerData.status = newStatus
        await bannerData.save()

        res.json({ success: true  , update:bannerData.status , bannerId:_id});
       
    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



const loadSales = async(req,res)=>{
    try {
        
       
        const page = +req.query.page || 1; 
        const skip = (page - 1) * ITEMS_PER_PAGE;
        const totalOrders = await Order.countDocuments({}); 
        let startdate ,enddate ,deliverystatus;
        const Orderdata = await Order.find({})
            .populate('customerId')
            .skip(skip)
            .limit(ITEMS_PER_PAGE);

        res.render('salesReport', {
            Orderdata: Orderdata, 
            startdate:startdate,
            enddate:enddate,
            deliverystatus:deliverystatus,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalOrders,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalOrders / ITEMS_PER_PAGE)
        });

    } catch (error) {
        console.log(error.message)
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}




const loadDateReport = async (req, res) => {
    try {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        
        // Adjust the end date to include the full day
        endDate.setDate(endDate.getDate() + 1);
        const filteredSales = await Order.find({
            createdOn: { $gte: startDate, $lt: endDate }
        }).populate('customerId')
        //res.json(filteredSales)
        res.json(filteredSales);
    } catch (error) {
        console.log(error.message);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
};








const fetchDataGraph = async (req, res) => {
    try {

        const time = req.params.time;
        if (time === 'month') {
            const currentYear = new Date().getFullYear();
            const data = await Order.aggregate([
                {
                    $match: {
                        createdOn: {
                            $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
                            $lt: new Date(`${currentYear + 1}-01-01T00:00:00.000Z`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$createdOn' }, 
                        ordersCount: { $sum: 1 } 
                    }
                }
            ]);

            const allMonths = {
                'January': 0,
                'February': 0,
                'March': 0,
                'April': 0,
                'May': 0,
                'June': 0,
                'July': 0,
                'August': 0,
                'September': 0,
                'October': 0,
                'November': 0,
                'December': 0
            };
            data.forEach(item => {
                const month = new Date(`2023-${item._id}-01`).toLocaleString('default', { month: 'long' });
                allMonths[month] = item.ordersCount;
            });

            res.json(allMonths);
        }


        if (time === 'year') {
            const startYear = 2019;
            const endYear = 2024;
            const ordersByYear = {};
        
   
            for (let year = startYear; year <= endYear; year++) {
                const data = await Order.aggregate([
                    {
                        $match: {
                            createdOn: {
                                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                                $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            ordersCount: { $sum: 1 }
                        }
                    }
                ]);
        
                
                const orderCount = data.length > 0 ? data[0].ordersCount : 0;
        
                ordersByYear[year] = orderCount;
            }
            res.json(ordersByYear);
        }



        if (time === 'week') {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            const currentDay = currentDate.getDate();
            
            const dayOfWeek = currentDate.getDay();
            
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            
            const startDate = new Date(currentYear, currentMonth, currentDay - dayOfWeek);
            
            
            const ordersByDayOfWeek = {};

            for (let day = 0; day < 7; day++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + day);
               
                const data = await Order.aggregate([
                    {
                        $match: {
                            createdOn: {
                                $gte: new Date(date.setHours(0, 0, 0, 0)),
                                $lt: new Date(date.setHours(23, 59, 59, 999))
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            ordersCount: { $sum: 1 }
                        }
                    }
                ]);
                
                const orderCount = data.length > 0 ? data[0].ordersCount : 0;

                ordersByDayOfWeek[dayNames[day]] = orderCount;
            }
        
            
            res.json(ordersByDayOfWeek);
        }
            
    } catch (error) {
        console.log(error);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
};










const downloadSalesReport = async(req,res)=>{
    try {

        let Orderdata;
        let deliverystatus=req.query.deliverystatus
        let query = {}; 
        let startdate = req.query.startdate;
        let enddate = req.query.enddate;
        if (deliverystatus && deliverystatus !== "Show all") {
            query.status = deliverystatus;
          }
          query.status = { $regex: new RegExp(deliverystatus, 'i') };
          
          
          if (deliverystatus && deliverystatus === "Show all") {
            query = {};
          }
          if (startdate && enddate) {
            query.createdOn = { $gte: new Date(startdate), $lt: new Date(enddate) };
          } else if (startdate) {
            query.createdOn = { $gte: new Date(startdate) };
          } else if (enddate) {
            enddate.setDate(enddate.getDate() + 1);
            query.createdOn = { $lt: new Date(enddate) };
          }

          
        Orderdata = await Order.find(query).populate('customerId');


        const templatePath = './views/admin/downloadsreport.ejs';
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const htmlTemplate = ejs.render(templateContent, { Orderdata });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlTemplate);
        const pdfBuffer = await page.pdf();
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
        res.send(pdfBuffer);
        
    } catch (error) {
        console.log(error);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}



const loadcustomreport = async (req, res) => {
    const page = +req.query.page || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    try {
      let deliverystatus = req.body.deliverystatus;
      let startdate = req.body.startdate;
      let enddate = req.body.enddate;
 

      let query = {}; 
      if (deliverystatus && deliverystatus !== "Show all") {
        query.status = deliverystatus;
      }
      query.status = { $regex: new RegExp(deliverystatus, 'i') };
      
      
      if (deliverystatus && deliverystatus === "Show all") {
        query = {};
      }


      if (startdate && enddate) {
        query.createdOn = { $gte: new Date(startdate), $lt: new Date(enddate) };
      } else if (startdate) {
        query.createdOn = { $gte: new Date(startdate) };
      } else if (enddate) {
        query.createdOn = { $lt: new Date(enddate) };
      }
  
      const totalOrders = await Order.countDocuments(query);
      const Orderdata = await Order.find(query)
        .populate('customerId')
        .skip(skip)
        .limit(ITEMS_PER_PAGE);
 
      res.render('salesReport', {
        Orderdata: Orderdata,
        startdate:startdate,
        enddate:enddate,
        deliverystatus:deliverystatus,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalOrders,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalOrders / ITEMS_PER_PAGE)
      });
    } catch (error) {
      console.log(error);
      res.status(500).render('adminerror', { message: "500: Internal Server Error...please try after sometime" });
    }
  };
  





const loadadminerror=async(req,res)=>{
    try {

        res.render('adminerror')
    } catch (error) {
        console.log(error);
        res.status(500).render('adminerror' , {message:"500: Internal Server Error...please try after sometime"}); 
    }
}








module.exports = {
    loadAdminLogin,
    verifyAdmin,
    loadAdminhome,  
    loadProducts,
    loadCategory,
    addCategory,
    loadAddProducts,
    deleteCategory,
    loadeditcategory,
    savecategory,
    Loadbrands,
    addBrand,
    deleteBrand,
    editBrand,
    Savebrand,
    Saveproducts,
    deleteproduct,
    productEdit,
    UpdateProduct,
    listUsers,
    Blockuser,
    Unblockuser,
    deleteImage, adminLogout,
    loadOrders,loadorderEdit,changeOrderStatus,
    acceptRequest,rejectRequest,acceptitemrequest,Rejectitemrequest,
    loadCoupons,addCoupons,loadcouponEdit,updateCoupon,deletecoupon,loadBanner,AddBanner,DeleteBanner,
    changestatus,loadSales,loadDateReport,fetchDataGraph,downloadSalesReport,loadadminerror
    ,searchProductshere,loadcustomreport
}