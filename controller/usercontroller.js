require('dotenv').config()
const ejs = require('ejs');
const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Category = require("../model/categoryModel");
const Product = require("../model/productModel");
const Brand = require("../model/brandsmodel");
const Order = require("../model/orderModel");
const Coupon = require("../model/CouponModel");
const { json } = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const Razorpay = require("razorpay");
const Banner = require("../model/BannerModel");
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEYID,
  key_secret:process.env.RAZORPAY_SECRET ,
});



//pagination
const ITEMS_PER_PAGE = 5;




//hashing password using bcrypt
const securepassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





// loading user homepage
const loadUserHome = async (req, res) => {
  try {
    const Bannerdata = await Banner.find({ status: true });
    const brandData = await Brand.find({ list: true });
    const categoryData = await Category.find({ list: true });
    const Allproducts = await Product.find({ list: true });
    const Menproducts = await Product.find({ gender: "male", list: true });
    const Womenproducts = await Product.find({ gender: "female", list: true });
    const jeansitems = await Product.find({
      category: "jeans",
      list: true,
    }).limit(8);

    const capcategory = await Product.find({ category: "cap", list: true });
    const jacketcategory = await Product.find({
      category: "jacket",
      list: true,
    });

    const shortscategory = await Product.find({
      category: "denim shorts",
      list: true,
    });

    if (req.session.user_id) {
      return res.redirect("/userDashboard");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("userhome", {
        shortscategory: shortscategory,
        jacketcategory: jacketcategory,
        capcategory: capcategory,
        brandData: brandData,
        Womenproducts: Womenproducts,
        Menproducts: Menproducts,
        Allproducts: Allproducts,
        categoryData: categoryData,
        jeansitems: jeansitems,
        Bannerdata:Bannerdata
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





//loading  user login page
const loadlogin = async (req, res) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/userDashboard");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("userlogin");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};





//loading user registration page
const loadregi = async (req, res) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/userDashboard");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("userregis");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};


function generateReferralCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}



//registering user to database
const insertUser = async (req, res) => {
  try {

    //checking if email already exists in database
    const checkEmail = await User.findOne({ email: req.body.email });
    if (checkEmail) {
      res.render("userregis", {
        message: "OOPS ! Email already exists , try again..",
      });
      return;
    } else {
      if(req.body.referalcode){
        const checkUser = await User.findOne({referralCode:req.body.referalcode})
        if(checkUser){
          checkUser.wallet = isNaN(checkUser.wallet) ? 0 : checkUser.wallet;
          checkUser.wallet += 500;
          await checkUser.save();
          const sPassword = await securepassword(req.body.password);
          const referralCode = generateReferralCode(5);
          const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: sPassword,
            is_admin: 0,
            list: 1,
            CartTotal: 0,
            referralCode:referralCode,
            wallet:200
          });
          const userData = await user.save();
          if (userData) {
            res.redirect("/login");
          } else {
            console.log("Registration failed due to internal error:", userData);
            res.render("userregis", { error: "Internal error try again" });
          }
        }else{
          return res.render('userregis' , { message: "OOPS ! Invalid referral code , try again!",})
        }
       
      } else{
        const sPassword = await securepassword(req.body.password);
        const referralCode = generateReferralCode(5);
        const user = new User({
          name: req.body.name,
          email: req.body.email,
          password: sPassword,
          is_admin: 0,
          list: 1,
          CartTotal: 0,
          referralCode:referralCode
        });
        const userData = await user.save();
        if (userData) {
          res.redirect("/login");
        } else {
          console.log("Registration failed due to internal error:", userData);
          res.render("userregis", { error: "Internal  error try again" });
        }
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};







//verifying user through login
const verifyUser = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.list == true) {
          res.setHeader("cache-control", "no-cache,no-store,must-revalidate");
          req.session.user_id = userData._id;
          return res.redirect("/loginhomepage");
        } else {
          res.render("userlogin", {
            message: "Sorry, user is blocked ! cannot login.",
          });
        }
      } else {
        res.render("userlogin", { message: "Invalid password !! try again" });
      }
    } else {
      console.log("invalid data");
      return res.render("userlogin", {
        message: "Invalid email !! try again..",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};















const loadloghomepage = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const brandData = await Brand.find({ list: true });
    const categoryData = await Category.find({ list: true });
    const Allproducts = await Product.find({ list: true });
    const Menproducts = await Product.find({ gender: "male", list: true });
    const Womenproducts = await Product.find({ gender: "female", list: true });
    const jeansitems = await Product.find({
      category: "jeans",
      list: true,
    }).limit(8);
    const capcategory = await Product.find({ category: "cap", list: true });
    const jacketcategory = await Product.find({
      category: "jacket",
      list: true,
    });
    const shortscategory = await Product.find({
      category: "denim shorts",
      list: true,
    });
    const Bannerdata = await Banner.find({ status: true });
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("userloginhome", {
        shortscategory: shortscategory,
        jacketcategory: jacketcategory,
        capcategory: capcategory,
        userData: userData,
        brandData: brandData,
        Womenproducts: Womenproducts,
        Menproducts: Menproducts,
        Allproducts: Allproducts,
        categoryData: categoryData,
        jeansitems: jeansitems,
        Bannerdata: Bannerdata,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};




//loading user dashboard
const userdashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    let orderdata = await Order.find({ customerId: userData._id });
    orderdata.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

    const user = await User.findById({ _id: req.session.user_id }).populate(
      "wishlist.productId"
    );
    const productsInwishlist = user.wishlist.map((Item) => Item.productId);

    const transactionData = user.transactionDetails;
    transactionData.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());

    const coupon = await Coupon.find({});
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("userDashboard", {
        userData: userData,
        orderdata: orderdata,
        coupon: coupon,
        transactionData: transactionData,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};



//logging out user by destroying the session
const userLogout = async (req, res) => {
  try {
    
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err.message);
      } else {
        // Redirect to the login page after successful session destruction
        res.redirect("/");
      }
    });
  } catch (error) {
    console.log("Error during logout:", error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





//loading otp page
const loadotplogin = async (req, res) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/userDashboard");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("userotplogin");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};






var generatedotp;
//verifying user email with OTP
const sendOtp = async (req, res) => {
  try {
    const checkEmail = await User.findOne({ email: req.body.email });
    if (!checkEmail) {
      console.log("email invalid...");
      res.render("userotplogin", {
        message: "Invalid email !! try again with a valid email",
      });
      return;
    } else if (checkEmail) {
      console.log("email valid...");
      const email = req.body.email;
      let otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      generatedotp = otpCode;

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: "albiejosephs101@gmail.com",
          pass: "fdfn ydtv ptts yxvx",
        },
      });

      const mailOptions = {
        from: "albiejosephs101@gmail.com",
        to: email,
        subject: "Verification Code",
        text: `Your OTP code is: ${otpCode}`,
      };

      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          console.error("Error sending email: ", err);
          return otpCode;
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};




//verifying otp
const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const otpcode = generatedotp;
    const otp = req.body.otp;
    const otps = otp.toString();
    const userData = await User.findOne({ email: email });

    if (userData) {
      if (otpcode === otps) {
        console.log("Correct OTP. Redirecting to userdashboard...");
        res.setHeader("cache-control", "no-cache,no-store,must-revalidate");
        //created a session here using user id ....
        req.session.user_id = userData._id;
        return res.redirect("/userdashboard");
      } else {
        console.log("Invalid OTP. Rendering userotplogin with message...");
        return res.render("userotplogin", {
          message: "Invalid OTP !! try again..",
        });
      }
    } else {
      console.log("Invalid data. Rendering userlogin with message...");
      return res.render("userlogin", {
        message: "Invalid email !! try again..",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};






//forgot password
const loadandverifyuser = async (req, res) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/userDashboard");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("OtpForPassword");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  
  }
};



var forgotemail;
const verifyOtpforgotpassword = async (req, res) => {
  try {
    const email = req.body.email;
    const otpcode = generatedotp;
    const otp = req.body.otp;
    const otps = otp.toString();
    const userData = await User.findOne({ email: email });
    forgotemail = email;
    if (userData) {
      if (otpcode === otps) {
        console.log("Correct OTP. Redirecting to forgot password page...");
        return res.redirect("/setupnewpassword");
      } else {
        console.log("Invalid OTP. Rendering userotplogin with message...");
        return res.render("userotplogin", {
          message: "Invalid OTP !! try again..",
        });
      }
    } else {
      console.log("Invalid data. Rendering userlogin with message...");
      return res.render("userlogin", {
        message: "Invalid email !! try again..",
      });
    }
  } catch (error) {
    console.log(error.message);
   res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};




const loadAndAddNewPassword = async (req, res) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/userDashboard");
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("changepasswordpage");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};



const updateUserPassword = async (req, res) => {
  try {
    const newPassword = req.body.password;
    const confirmPassword = req.body.Confirmpassword;
    const sPassword = await securepassword(newPassword);

    if (newPassword === confirmPassword) {
      const updateField = {
        password: sPassword,
      };

      const addSuccess = await User.updateOne(
        { email: forgotemail },
        { $set: updateField },
        { new: true } // Return the updated document
      );

      if (addSuccess) {
        console.log("User password Updated successfully");
        return res.redirect("/login");
      } else {
        console.log("Error updating product to the database.");
        return res
          .status(500)
          .render("errorPage", {
            message: "Error updating product to the database.",
          });
      }
    } else {
      console.log("password not updated");
      res.render("userlogin");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const Loadmenonly = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    const gender = req.query.gender;
    const categoryy = req.query.categoryName
    const sort = req.query.sort
    let totalProducts = await Product.find({
      gender: gender,
      list: true,
    }).countDocuments();


    

    let productData = await Product.find({ gender: gender, list: true })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    if(categoryy){
      productData = await Product.find({ gender: gender , category:categoryy , list: true })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
      totalProducts = await Product.find({
        gender: gender,
        category:categoryy,
        list: true,
      }).countDocuments();
    }

    if(sort){
      productData = await Product.find({ gender: gender, category:categoryy ,list: true })
      .sort({ offerPrice: sort })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

      totalProducts = await Product.find({
        gender: gender,
        category:categoryy,
        list: true,
      }).sort({ offerPrice: sort }).countDocuments();
    }



    const categoryData = await Category.find({});
    const brandData = await Brand.find({});
    const userData = await User.findById({ _id: req.session.user_id });
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("allCategories", {
        productData: productData,
        categoryData: categoryData,
        brandData: brandData,
        currentPage: page,
        totalPages: totalPages,
        userData: userData,
        gender: gender,
        categoryy:categoryy,
        sort:sort
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





// const LoadWomenonly = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   try {
//     const gender = req.query.gender;
//     const categoryy = req.query.categoryName

//     const totalProducts = await Product.find({
//       gender: gender,
//       list: true,
//     }).countDocuments();

//     const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

//     let  productData = await Product.find({ gender: gender })
//       .skip((page - 1) * ITEMS_PER_PAGE)
//       .limit(ITEMS_PER_PAGE);
//       if(categoryy){
//         productData = await Product.find({ gender: gender , category:categoryy , list: true })
//         .skip((page - 1) * ITEMS_PER_PAGE)
//         .limit(ITEMS_PER_PAGE);
//       }
//     const categoryData = await Category.find({});
//     const brandData = await Brand.find({});
//     const userData = await User.findById({ _id: req.session.user_id });
//     if (userData) {
//       res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
//       res.render("allCategories", {
//         productData: productData,
//         categoryData: categoryData,
//         brandData: brandData,
//         currentPage: page,
//         totalPages: totalPages,
//         userData: userData,
//         gender: gender,
//       });
//     } else {
//       res.redirect("/login");
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

//   }
// };


const checkingproduct = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const userData = await User.findOne({ _id: userid });
    const id = req.query.id;
    const productData = await Product.find({ _id: id });
    const categoryData = await Category.find({});
    const brandData = await Brand.find({});
    if (productData.length > 0) {
      const product = productData[0];
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("productView", {
        product: product,
        categoryData: categoryData,
        brandData: brandData,
        userData: userData,
      });
    } else {
  
      res.redirect("/allCategories");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};





const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

const checkPasswordStrength = async (req, res) => {
  try {
    const password = req.body.password;
    const isStrong = isStrongPassword(password);
    if (isStrong) {
      res.send("Great! You have entered a strong password.");
    } else {
      res.send("OOPS! Please use a valid strong password.");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const checkPasswordMatch = async (req, res) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    // Check if passwords match
    const passwordsMatch = password === confirmPassword;

    // Send the appropriate response
    if (passwordsMatch) {
      res.send("Passwords match!");
    } else {
      res.send("OOPS! Passwords do not match.");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};






const loadedituseraddress = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const username = req.body.Username;
    const orderdata = await Order.find({ customerId: userData._id });
    const newemail = req.body.email;
    // const newpassword = req.body.password

    const checkEmail = await User.findOne({ email: req.body.email });
    if (checkEmail) {
      res.render("userDashboard", {
        addressmessage: "OOPS ! Email already exists , try again..",
        userData: userData,
        orderdata: orderdata,
      });
      return;
    }

    if (!username || !newemail) {
      res.render("userDashboard", {
        message: "Some fileds were missing . Try again !",
        userData: userData,
        orderdata: orderdata,
      });
      return;
    }

    const updateFields = {
      name: username,
      email: newemail,
    };

    const addSuccess = await User.findByIdAndUpdate(
      { _id: req.body.userId },
      { $set: updateFields },
      { new: true } // Return the updated document
    );

    if (addSuccess) {
      console.log("User address Updated successfully");
      return res.redirect("/userdashboard");
    } else {
      console.log("Error updating product to the database.");
      return res
        .status(500)
        .render("errorPage", {
          message: "Error updating product to the database.",
        });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};




const Loadaboutpage = async (req, res) => {
  try {
    const brandData = await Brand.find({});
    const userData = await User.findById({ _id: req.session.user_id });
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("Aboutpage", { brandData: brandData, userData: userData });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};

const loadcontactpage = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("contact.ejs", { userData: userData });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};




const loadWishlist = async (req, res) => {
  try {
    const productData = await Product.find({});
    const userData = await User.findById({ _id: req.session.user_id });
    const user = await User.findById({ _id: req.session.user_id }).populate(
      "wishlist.productId"
    );
    const productsInwishlist = user.wishlist.map((Item) => Item.productId);
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("wishlist", {
        productData: productData,
        userData: userData,
        productsInwishlist: productsInwishlist,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};





const loadshopcart = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const user = await User.findById({ _id: req.session.user_id }).populate(
      "cart.productId"
    );
    const productsInCart = user.cart.map((cartItem) => cartItem.productId);
    if (userData) {
      userData.CartTotal = 0;
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      // Iterate through cart items and calculate CartTotal
      for (let i = 0; i < userData.cart.length; i++) {
        const subtotal = parseFloat(userData.cart[i].subtotal);
        if (!isNaN(subtotal)) {
          userData.CartTotal += subtotal;
        }
      }

      await userData.save();
      res.render("shopcart", {productsInCart: productsInCart,userData: userData});
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const addtocartitem = async (req, res) => {
  try {
    const { productId, size } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    const userId = req.session.user_id;
    const user = await User.findById(userId);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (user) {
      const existingCartItem = user.cart.find(
        (item) => item.productId.toString() === productId && item.size === size
      );

      if (existingCartItem) {
        // If it exists, increase the quantity
        existingCartItem.quantity += 1;
        existingCartItem.subtotal += product.offerPrice;
      } else {
        // If it doesn't exist, add a new item to the cart
        user.cart.push({
          productId: productId,
          quantity: 1,
          size: size,
          subtotal: product.offerPrice,
        });
      }

      await user.save();

      res.redirect("/shopcart");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};



const addtocartfromwishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    const userId = req.session.user_id;
    const user = await User.findById(userId);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const size = product.size[0];
    if (user) {
      const existingCartItem = user.cart.find(
        (item) => item.productId.toString() === productId && item.size === size
      );

      if (existingCartItem) {
        // If it exists, increase the quantity
        existingCartItem.quantity += 1;
        existingCartItem.subtotal += product.offerPrice;
      } else {
        // If it doesn't exist, add a new item to the cart
        user.cart.push({
          productId: productId,
          quantity: 1,
          size: size,
          subtotal: product.offerPrice,
        });
      }

      user.wishlist.pull({ productId: productId });
      await user.save();

      console.log(
        "Product added to cart successfully and removed from wishlist"
      );
      res.redirect("/wishlist");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





const updatePassword = async (req, res) => {
  try {
    const newPassword = req.body.password;
    const confirmPassword = req.body.confirmpassword;
    const sPassword = await securepassword(newPassword);
    const userData = await User.findById({ _id: req.session.user_id });

    if (newPassword == confirmPassword) {
      const updateField = {
        password: sPassword,
      };

      const addSuccess = await User.findByIdAndUpdate(
        { _id: req.body.userId },
        { $set: updateField },
        { new: true } // Return the updated document
      );

      if (addSuccess) {
        console.log("User password Updated successfully");
        return res.redirect("/userdashboard");
      } else {
        console.log("Error updating password to the database.");
        return res
          .status(500)
          .render("errorPage", {
            message: "Error updating password to the database.",
          });
      }
    } else {
      res.render("userDashboard", {
        mymessage: "passwords are not matching..",
        userData: userData,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const addnewaddress = async (req, res) => {
  try {
    const userId = req.body.userId;
    const newAddress = {
      Name: req.body.name,
      Housename: req.body["House-name"],
      Street: req.body["Street-name"],
      Pincode: req.body.Pincode,
      Country: req.body.Country,
      Phone: req.body.Phone,
    };

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).render('errorpage' , {message:"404: User not found."}); 
    }

    // Add the new address to the user's Address array
    user.Address.push(newAddress);

    // Save the updated user to the database
    await user.save();

    res.redirect("/userdashboard");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const addnewaddressfromcheckout = async (req, res) => {
  try {
    const userId = req.body.userId;
    const newAddress = {
      Name: req.body.name,
      Housename: req.body["House-name"],
      Street: req.body["Street-name"],
      Pincode: req.body.Pincode,
      Country: req.body.Country,
      Phone: req.body.Phone,
    };

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).render('errorpage' , {message:"404: User not found."}); 
    }

    // Add the new address to the user's Address array
    user.Address.push(newAddress);

    // Save the updated user to the database
    await user.save();

    res.redirect("/usercheckout");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const addressId = req.query.addressId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).render('errorpage' , {message:"404: User not found."}); 

    }
    user.Address.pull({ _id: addressId });

    await user.save();

    res.redirect("/userdashboard");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





const loadeditprofileaddress = async (req, res) => {
  try {
    const addressId = req.query.addressId;
    const userData = await User.findById({ _id: req.session.user_id });
    const addressData = userData.Address.id(addressId);
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("edit-profile-address", {
        addressData: addressData,
        userData: userData,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};






const loadeditprofileaddresstocheckout = async (req, res) => {
  try {
    const addressId = req.query.addressId;
    const userData = await User.findById({ _id: req.session.user_id });
    const addressData = userData.Address.id(addressId);
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("edit-profile-address-checkout", {
        addressData: addressData,
        userData: userData,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};






const updateUserAddress = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const name = req.body.name;
    const housename = req.body["House-name"];
    const street = req.body["Street-name"];
    const pincode = req.body.Pincode;
    const country = req.body.Country;
    const phone = req.body.Phone;

    if (!name || !housename || !street || !pincode || !country || !phone) {
      // Return an appropriate response or handle the error
      return res.render("edit-profile-address", {
        message: "Hey, some fields are missing! Please check and try again...",
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, "Address._id": req.body.addressId },
      {
        $set: {
          "Address.$.Name": name,
          "Address.$.Housename": housename,
          "Address.$.Street": street,
          "Address.$.Pincode": pincode,
          "Address.$.Country": country,
          "Address.$.Phone": phone,
        },
      }
    );

    if (!user) {
      return res.status(404).render('errorpage' , {message:"404"}); 

    }

    res.redirect("/userdashboard");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};






const updateUserAddressFromcheckout = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const name = req.body.name;
    const housename = req.body["House-name"];
    const street = req.body["Street-name"];
    const pincode = req.body.Pincode;
    const country = req.body.Country;
    const phone = req.body.Phone;

    if (!name || !housename || !street || !pincode || !country || !phone) {
      // Return an appropriate response or handle the error
      return res.render("edit-profile-address", {
        message: "Hey, some fields are missing! Please check and try again...",
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, "Address._id": req.body.addressId },
      {
        $set: {
          "Address.$.Name": name,
          "Address.$.Housename": housename,
          "Address.$.Street": street,
          "Address.$.Pincode": pincode,
          "Address.$.Country": country,
          "Address.$.Phone": phone,
        },
      }
    );

    if (!user) {
     return  res.status(404).render('errorpage' , {message:"404: Address not found.."}); 

    }

    res.redirect("/usercheckout");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};






const deleteItemFromCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const itemId = req.query.itemId;
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found");
     return res.status(404).render('errorpage' , {message:"404: user  not found."}); 

    }

    // Use $pull to remove the item from the cart array
    user.cart.pull({ _id: itemId });
    await user.save();
    res.redirect("/shopcart");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





const updateQuantity = async (req, res) => {
  try {
    const { userId, cartId, productId, count } = req.body;
    const customer = await User.findById(userId);
    const cartItem = customer.cart.id(cartId);
    const products = await Product.findById(productId);
    const offerPrice = parseInt(products.offerPrice);

    if (cartItem) {
      let quant = Math.max(1, cartItem.quantity + count);
      if (quant > products.stock) {
        return res.json({ message: "Sorry dear ,no more stock available!" });
      } else {
        cartItem.quantity = quant;
        cartItem.subtotal = cartItem.quantity * offerPrice;
        await customer.save();
      }
    } else {
      res.status(404).render('errorpage' , {message:"404: Cart item not found."}); 
    }

    customer.CartTotal = 0;
    for (let i = 0; i < customer.cart.length; i++) {
      customer.CartTotal += customer.cart[i].subtotal;
    }
    await customer.save();

    res.json({
      updatedQuantity: cartItem.quantity,
      productValue: cartItem.subtotal,
      cartTotal: customer.CartTotal,
    });
  } catch (error) {
    console.log(error);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};







const loadCheckoutPage = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const user = await User.findById({ _id: req.session.user_id }).populate(
      "cart.productId"
    );
    const productsInCart = user.cart.map((cartItem) => cartItem.productId);
    if (userData) {
      if (productsInCart.length < 1) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.render("checkout", {
          productsInCart: productsInCart,
          userData: userData,
          item: userData.cart,
          pmessage: "Add products to cart to make a purchase!!",
        });
      } else {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.render("checkout", {
          productsInCart: productsInCart,
          userData: userData,
          item: userData.cart,
        });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};






const addItemToWishlist = async (req, res) => {
  try {
    const productid = req.body.product_id;
    console.log(productid);
    const user = await User.findOne({ _id: req.session.user_id });

    if (user) {
     
      const existingWishlistItem = user.wishlist.find(
        (item) => item.productId.toString() === productid
      );
      var count = user.wishlist.length;
      if (existingWishlistItem) {
        res.json({ error: "Item already present in wishlist :)", count: count });
      } else {
        user.wishlist.push({ productId: productid });
        await user.save();
        count = user.wishlist.length;
        res.status(200).json({ message: "item added to Wishlist :)", count: count });
      }
    } else {
      // res.redirect('/login')
      res.json({ message: "Please Login & add items to wishlist :(" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};






const deletewishlistItem = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const itemId = req.query.itemId;
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return  res.status(404).render('errorpage' , {message:"404: User not found !"}); 
    }

    user.wishlist.pull({ _id: itemId });
    await user.save();
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};






const loadOrderConfirmation = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    if (userData) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("Orderplaced");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};





var items;
const confirmOrderDetails = async (req, res) => {
  try {

    const CouponData = await Coupon.findOne({ Code: ccode });
    const userid = req.session.user_id;
    const uniqueOrderId = uuidv4();
    items = JSON.parse(req.body.itemdata);
    const date = new Date();
    const UserData = JSON.parse(req.body.customerdata);
    const userData = await User.findById({ _id: req.session.user_id });
    const user = await User.findById({ _id: req.session.user_id }).populate("cart.productId");
    const productsInCart = user.cart.map((cartItem) => cartItem.productId);
    const addressid = req.body.address;
    const address = user.Address.find((add) => {
      return add._id.toString() === addressid;
    });

    function generateRazorpay(orderid, totalamount) {
      return new Promise((resolve, reject) => {
        var options = {
          amount: totalamount * 100,
          currency: "INR",
          receipt: orderid,
        };
        instance.orders.create(options, function (error, order) {
          if (error) {
            console.log(error);
          } else {
            resolve(order);
          }
        });
      });
    }

    
      const orderedItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        status: "Pending",
        size: item.size,
        subtotal: item.subtotal,
      }));

      const order = new Order({
        customerId: UserData._id,
        Items: orderedItems,
        Address: {
          Name: address.Name,
          Housename: address.Housename,
          Street: address.Street,
          Pincode: address.Pincode,
          Country: address.Country,
          Phone: address.Phone,
        },
        paymentMethod: req.body.payment_option,
        shippingcharge: 0,
        discount: discount ? discount : 0,
        totalAmount: grandTotal ? grandTotal : UserData.CartTotal,
        createdOn:date,
        deliveredOn: "nill",
        status: "Pending",
        orderId: uniqueOrderId,
        payment: "not done",
      });
      const data = await order.save();
      if (data) {
        if (req.body.payment_option === "Cash On Delivery") {
          for (let i = 0; i < items.length; i++) {
            let productId = items[i].productId;
            let product = await Product.findById(productId);
            product.stock = product.stock - items[i].quantity;
            await product.save();
          }
          data.payment = "payment done";
          await order.save();
          userData.cart = [];
          await userData.save();
          if (CouponData && userData.coupon) { // Check if CouponData is not null
            CouponData.customers.push(userid);
            await CouponData.save();
          }
          console.log(
            "user selected cash on delivery for order and products deledted from cart"
          );
          res.json({ codsucess: "order placed" });
        } else {
          generateRazorpay(data.orderId, data.totalAmount).then((response) => {
            res.json(response);
          });
        }
      }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};





const loadFullOrderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderid;
    const order = await Order.findOne({ _id: orderId });
    const addressData = order.Address;
    const Orderr = await Order.findOne({ _id: orderId }).populate(
      "Items.productId"
    );
    const productData = Orderr.Items.map((item) => {
      return item.productId;
    });
    //addressData contains the address used at ordering
    //orderr cotains  the basic order details
    //productData is an array and contains the details of the products in the order.
    if (Orderr) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.render("fullOrder", {
        addressData: addressData,
        Orderr: Orderr,
        productData: productData,
        items: Orderr.Items,
      });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};





const cancelOrder = async (req, res) => {
  try {
    const orderid = req.params.orderid;
    let result = await Order.updateOne(
      { _id: orderid },
      { $set: { status: "Cancelled" } }
    );
    const orderdata = await Order.findOne({ _id: orderid });
    const user = await User.findOne({ _id: req.session.user_id });

    if (result) {
      for (let i = 0; i < orderdata.Items.length; i++) {
        orderdata.Items[i].status = "Cancelled";
      }
      await orderdata.save();
    }

    if (result) {
      //for inserting stock back while cancelling order
      for (let i = 0; i < orderdata.Items.length; i++) {
        let productId = orderdata.Items[i].productId;
        let product = await Product.findById(productId);
        product.stock = product.stock + orderdata.Items[i].quantity;
        await product.save();
        console.log("order cancelled and item restocked successfully");
      }

      if (orderdata.paymentMethod === "Razorpay") {
        user.wallet = user.wallet + orderdata.totalAmount;
        user.transactionDetails.push({
          transactionType: "Credit",
          transactionAmount: orderdata.totalAmount,
          transactionDate: new Date(),
          orderId: orderdata.orderId,
        });
        await user.save();
      }
      res.redirect(`/fullOrderDetails?orderid=${orderid}`);
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





const validatePassChange = async (req, res) => {
  try {
    const currentPassword = req.body.currentPassword; // Access the "currentPassword" property
    const userData = await User.findOne({ _id: req.session.user_id });

    if (userData) {
      const passwordMatch = await bcrypt.compare(
        String(currentPassword),
        String(userData.password)
      );
      if (passwordMatch) {
        console.log("Password matched");
        res.json({ message: "Password is Correct, please update now." });
      } else {
        res.status(400).json({ message: "Entered current password is wrong!" });
      }
    } else {
      res.status(404).render('errorpage' , {message:'404  : User not found'}); 
    }
  } catch (error) {
    console.error(error); // Log the error
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};





const loadsendmessage = async (req, res) => {
  try {
    const { name, email, telephone, subject, message } = req.body;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "albiejosephs101@gmail.com",
        pass: "fdfn ydtv ptts yxvx",
      },
    });

    const mailOptions = {
      from: email,
      to: "albiejosephs101@gmail.com", // Replace with the recipient's email address
      subject: subject,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${telephone}\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.render("contact", {
          message: "Message not sent, please try again.",
        });
      } else {
        console.log("Email sent: " + info.response);
        // res.render('contact', { message: "Message sent successfully!" })
        res.json({ message: "message sent successfully.." });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};



const loadSearchItems = async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  try {
    const searchQuery = req.query.query;
    const sort = parseInt(req.query.sort)
    let sortcriteria
    if(sort && sort===-1){
      sortcriteria = {offerPrice:-1}
    }else {
      sortcriteria = {offerPrice:1}
    }


    const userData = await User.findOne({ _id: req.session.user_id });
    const categoryData = await Category.find({ list: true });

    const totalProducts = await Product.countDocuments({
      $or: [
        { productName: { $regex: new RegExp(searchQuery, "i") } }, { Discription: { $regex: new RegExp(searchQuery, "i") } },
        { category: { $regex: new RegExp(searchQuery, "i") } },
        { brand: { $regex: new RegExp(searchQuery, "i") } },
        {gender:{ $regex: new RegExp(searchQuery, "i") }}
      ],
    });

    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);


    let searchResults = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(searchQuery, "i") } }, { Discription: { $regex: new RegExp(searchQuery, "i") } },
        { category: { $regex: new RegExp(searchQuery, "i") } },
        { brand: { $regex: new RegExp(searchQuery, "i") } },
        {gender:{ $regex: new RegExp(searchQuery, "i") }}
      ],}).skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);

    if(sort){
      searchResults = await Product.find({
        $or: [
          { productName: { $regex: new RegExp(searchQuery, "i") } }, { Discription: { $regex: new RegExp(searchQuery, "i") } },
          { category: { $regex: new RegExp(searchQuery, "i") } },
          { brand: { $regex: new RegExp(searchQuery, "i") } },
          {gender:{ $regex: new RegExp(searchQuery, "i") }}
        ],}).skip((page - 1) * ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).sort(sortcriteria)
    }


    if (searchResults.length > 0) {
      res.render("searchresult", {
        categoryData: categoryData,
        userData: userData,
        searchResults: searchResults,
        currentPage: page,
        totalPages: totalPages,
        searchQuery:searchQuery,
        sort:sort
      });
    } else {
      res.render("searchresult", {
        categoryData: categoryData,
        userData: userData,
        searchResults: searchResults,
        currentPage: page,
        totalPages: totalPages,
        searchQuery:searchQuery,
        sort:sort,
        message: "Sorry, no items for your search !",
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).render('errorpage', { message: "500: Internal Server Error...please try after sometime" });
  }
};




const sortProduts = async (req, res) => {
  try {

        const sortOption = req.query.sort;
        let sortOrder = 1; // Default: Low to High
        if (sortOption === "high-to-low") {
            sortOrder = -1; // High to Low
        }
        const sortedProducts = await Product.find().sort({ offerPrice: sortOrder });
        res.json({ products: sortedProducts });
        
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};



const deleteItems = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const itemId = req.params.itemId;
    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return res.status(404).json({ message: "404 : Order not found" });
    }

    const item = order.Items.find(
      (item) => item.productId.toString() === itemId
    );
    
    if (!item) {
      return res.status(404).render('errorpage' , {message:"404 : Item not found in the order"}); 
    }

    item.status = "Cancelled";

    const allItemsCancelled = order.Items.every(
      (item) => item.status === "Cancelled"
    );

    // Update the order status
    if (allItemsCancelled) {
      order.status = "Cancelled";
    }
    let product = await Product.findById(itemId);
    product.stock = product.stock + item.quantity;
    order.totalAmount = order.totalAmount - item.subtotal;
    await product.save();
    await order.save();
    console.log(
      "singe item cancelled from order and stock restocked successfully"
    );
    res.redirect(`/fullOrderDetails?orderid=${orderId}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};




const requestchange = async (req, res) => {
  try {

    const selectedReason = req.body.selectedReason;
    const orderid = req.params.orderId;
    const order = await Order.findOne({ _id: orderid });
    const update = await Order.updateOne(
      { _id: orderid },
      {
        $set: {
          returnStatus: "Request Pending",
          returnReason: selectedReason,
          return: 1,
        },
      }
    );

    if (update) {
      for (let i = 0; i < order.Items.length; i++) {
        order.Items[i].return = true;
        order.Items[i].returnStatus = "Request Pending";
        order.Items[i].returnReason = selectedReason;
      }
      await order.save();
      res.json({ message: "Return Requested" });
    } else {
      res.status(400).render('errorpage' , {message:400}); 
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 

  }
};




const returnItem = async (req, res) => {
  try {
    const selectedReason = req.body.selectedReason;
    const orderId = req.params.orderid;
    const itemId = req.params.itemid;

    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return  res.status(404).render('errorpage' , {message:404}); 
    }
    const item = order.Items.find((item) => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in the order" });
    }

    item.returnStatus = "Request Pending";
    item.returnReason = selectedReason;
    item.return = true;

    const allItemsreturned = order.Items.every(
      (item) => item.returnStatus === "Request Pending"
    );

    if (allItemsreturned) {
      order.returnStatus = "Request Pending";
      order.returnReason = selectedReason;
      order.return = true;
    }

    await order.save();
    console.log("single  item return request initiated  from delivered order.");
    res.redirect(`/fullOrderDetails?orderid=${orderId}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const loadverify = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const CouponData = await Coupon.findOne({ Code: ccode });
    const userid = req.session.user_id;
    const { payment, order } = req.body;
    let or = JSON.parse(order);
    let orderid = or.receipt.toString();

    const orderdata = await Order.findOne({ orderId: orderid });
    const success = await User.updateOne(
      { _id: userid },
      { $set: { cart: [] } }
    );
    if (success) {
      orderdata.payment = "payment done";
      await orderdata.save();
      for (let i = 0; i < items.length; i++) {
        let productId = items[i].productId;
        let product = await Product.findById(productId);
        product.stock = product.stock - items[i].quantity;
        await product.save();
      }
      if (CouponData && userData.coupon) { // Check if CouponData is not null
        CouponData.customers.push(userid);
        await CouponData.save();
      }
      res.json({ orderid: orderid });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




let grandTotal;
let discount;
var ccode;
const applycoupon = async (req, res) => {
  try {
    const userid = req.session.user_id.toString();
    const userData = await User.findById(userid);
    ccode = req.body.code;
    const carttotal = req.body.cartTotal;
    const found = await Coupon.findOne({ Code: ccode });

    if (found) {
        const userAlreadyUsedCoupon = found.customers.some((customer) => customer._id.toString() === userid);
          if (userAlreadyUsedCoupon) {
            res.json({ alreadyUsed: "Coupon has already been used by this user." });
          } 

        else if (new Date() <= found.Expiry) {
            if (carttotal >= found.minimumAmount) {
            grandTotal = carttotal - carttotal * (found.Discount / 100);
            discount = Math.ceil(carttotal * (found.Discount / 100));
            if (discount > found.maximumAmount) {
                discount = found.maximumAmount;
            }
            userData.coupon = true;
            await userData.save();
            res.json({ grandTotal: grandTotal, discount: discount });
            } else {
            res.json({
                minimumvalid: "Minimum purchase amount should be maintained",
            });
            }
        } else {
            res.json({ expiry: " sorry Coupon expired !" });
        }
    } else {
      res.json({ noCoupon: "Invalid Coupon" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const Removeallitems = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const update = await User.updateOne(
      { _id: userid },
      { $set: { wishlist: [] } }
    );
    if (update) {
      console.log("all items in wishlist removed");
      res.redirect("/wishlist");
    } else {
      res.status(400).render('errorpage' , {message:400}); 
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const Addallitemstocart = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const user = await User.findOne({ _id: userid });
    if (user) {
      for (let i = 0; i < user.wishlist.length; i++) {
        const productId = user.wishlist[i].productId;
        const foundProduct = await Product.findById(productId);
        const foundsize = foundProduct.size[0];
        // Find the corresponding cart item with the same productId and size
        const existingCartItem = user.cart.find(
          (item) =>
            item.productId.toString() === productId.toString() &&
            item.size === foundsize
        );

        if (existingCartItem) {
          if (existingCartItem.quantity < foundProduct.stock) {
            existingCartItem.quantity += 1;
            existingCartItem.subtotal += foundProduct.offerPrice;
          } else {
            existingCartItem.quantity = existingCartItem.quantity;
            existingCartItem.subtotal += foundProduct.offerPrice;
          }
        } else {
          // If it doesn't exist, add a new item to the cart
          user.cart.push({
            productId: productId,
            quantity: 1,
            size: foundsize,
            subtotal: foundProduct.offerPrice,
          });
        }
      }
      user.wishlist = [];
      await user.save();
      console.log("All items pushed to cart, and wishlist cleared.");
      res.redirect("/shopcart");
    } else {
      console.log(error.message)
      res.status(400).render('errorpage' , {message:400}); 
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const loadCategoryFilter = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    const categoryname = req.query.categoryName;
    const sort = parseInt(req.query.sort)
    let sortcriteria
    if(sort && sort===-1){
      sortcriteria = {offerPrice:-1}
    }else {
      sortcriteria = {offerPrice:1}
    }
    const categoryData = await Category.find({});
    const brandData = await Brand.find({});
    const userData = await User.findById({ _id: req.session.user_id });

    const totalProducts = await Product.find({
      category: categoryname,
      list: true,
    }).countDocuments();
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    const productData = await Product.find({
      category: categoryname,
      list: true,
    })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .sort(sortcriteria)

    const filteredProducts = await Product.find({
      category: categoryname,
      list: true,
    });
    console.log("filtering done", filteredProducts);
    res.render("categoryfilter", {
      brandData: brandData,
      currentPage: page,
      totalPages: totalPages,
      userData: userData,
      productData: productData,
      categoryData: categoryData,
      categoryname:categoryname,
      sort:sort
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};




const ClearCart = async (req, res) => {
  try {
    const userid = req.session.user_id;
    const user = await User.findById(userid);
    if (user) {
      user.cart = [];
      await user.save();
      res.redirect("/shopcart");
    } else {
      res.status(400).render('errorpage' , {message:400})
    }
  } catch (error) {
    console.log(error);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
};





const loadErrorPage = async(req,res)=>{
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.render('errorpage')
  } catch (error) {
    console.log(error);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
}




const loadserverErrorPage = async(req,res)=>{
  try {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.render('servererror')
  } catch (error) {
    console.log(error);
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
}






const postUserReview = async(req,res)=>{
  try {
    const comment = req.body.comment;
    const name = req.body.name;
    const rate = req.body.rate
    const productid = req.body.productid
    const productData = await Product.findById(productid)
    if(productData){
      productData.reviews.push({
        customerName:name,
        review:comment,
        date:new Date(),
        rating:rate
      })
      productData.totalRatings += 1;
      productData.averageRating =
          (productData.averageRating + rate) / productData.totalRatings;
      await productData.save();
      res.redirect(`/productview?id=${productData._id}`)
    }else{
      console.log("product data not found")
      res.status(400).render('errorpage' , {message:400}); 
    }
    
  } catch (error) {
    console.log(error.message)
    res.status(500).render('errorpage' , {message:"500: Internal Server Error...please try after sometime"}); 
  }
}


const loadUserOrders = async(req,res)=>{
  try {

    const pageSize = 5; 
    const page = parseInt(req.query.page) || 1; 
    const skip = (page - 1) * pageSize
    const userData = await User.findById(req.session.user_id)
    const orderdata = await Order.find({}).sort({ createdAt: -1 }).skip(skip).limit(pageSize);
    const totalOrders = await Order.find({}).countDocuments()
    const totalPages = Math.ceil(totalOrders / pageSize);


    res.render('myOrders',{orderdata:orderdata , userData:userData,page :page ,totalPages:totalPages})
  } catch (error) {
    console.log(error.message)
    res.status(500).render('errorpage',{message:"500: Internal error , please try again . !"})
  }
}



const downloadInvoice = async(req,res)=>{
  try {
    const id = req.query.id
    const order = await Order.findOne({ _id: id });
    const addressData = order.Address;
    const Orderr = await Order.findOne({ _id: id }).populate(
      "Items.productId"
    );
    
    const productData = Orderr.Items.map((item) => {
      return item.productId;
    });

    const templatePath = './views/user/invoice.ejs';
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const htmlTemplate = ejs.render(templateContent, { Orderr : Orderr , addressData:addressData , productData:productData ,  items: Orderr.Items });

     // Generate PDF using Puppeteer
     const browser = await puppeteer.launch();
     const page = await browser.newPage();
     await page.setContent(htmlTemplate);
     const pdfBuffer = await page.pdf();
     await browser.close();

     res.setHeader('Content-Type', 'application/pdf');
     res.setHeader('Content-Disposition', `attachment; filename=invoice-${ req.query.id}.pdf`);
     res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating or sending PDF:', error);
    res.status(500).send('Internal Server Error');
  }
}







module.exports = {
  loadloghomepage,
  loadUserHome,
  loadlogin,
  loadregi,
  insertUser,
  userdashboard,
  verifyUser,
  userLogout,
  sendOtp,
  loadandverifyuser,
  loadotplogin,
  verifyOtp,
  Loadmenonly,
  checkingproduct,
  checkPasswordStrength,
  checkPasswordMatch,
  Loadaboutpage,
  loadcontactpage,
  loadWishlist,
  loadshopcart,
  addtocartitem,
  loadedituseraddress,
  updatePassword,
  addnewaddress,
  deleteAddress,
  loadeditprofileaddress,
  updateUserAddress,
  deleteItemFromCart,
  updateQuantity,
  loadCheckoutPage,
  verifyOtpforgotpassword,
  loadAndAddNewPassword,
  updateUserPassword,
  addItemToWishlist,
  deletewishlistItem,
  addtocartfromwishlist,
  addnewaddressfromcheckout,
  loadeditprofileaddresstocheckout,
  updateUserAddressFromcheckout,
  loadOrderConfirmation,
  confirmOrderDetails,
  loadFullOrderDetails,
  cancelOrder,
  validatePassChange,
  loadsendmessage,
  loadSearchItems,
  sortProduts,
  deleteItems,
  requestchange,
  returnItem,
  loadverify,
  applycoupon,
  loadCategoryFilter,
  Removeallitems,
  Addallitemstocart,
  ClearCart,loadErrorPage,loadserverErrorPage,postUserReview,loadUserOrders,downloadInvoice
};
