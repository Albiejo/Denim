# Denim Store E-Commerce Project

Welcome to Denim Store, an e-commerce website built with Express.js, MongoDB, and Node.js. This project showcases the features of an online store for purchasing denim products. Additionally, it includes an admin panel for managing products and handling refunds.

## Features

- **User Side:**
  - Browse and purchase denim products.
  - Add products to the cart and proceed to checkout.
  - View order history and track orders.

- **Admin Side:**
  - Add new products with details such as name, description, price, and quantity.
  - Update existing product details.
  - Manage order refunds and returns.

## Getting Started

To get started with this project, follow these steps:

1. **Clone the repository:**
git clone <repository-url>

2. **Install dependencies:**
cd DenimStore
npm install

3. **Set up MongoDB:**
- Make sure you have MongoDB installed and running on your local machine or provide the connection string to a remote MongoDB database in the configuration.

4. **Start the server:**
npm start
5. **Access the application:**
- Open your browser and navigate to `http://localhost:3000` to access the user side.
- For the admin panel, navigate to `http://localhost:3000/admin`.

## Folder Structure

The project directory structure is as follows:

- `controllers/`: Contains the controller logic for handling HTTP requests.
- `models/`: Contains the data models for MongoDB.
- `routes/`: Contains the route definitions for the Express.js application.
- `views/`: Contains the views/templates for rendering HTML pages.
- `public/`: Contains static assets such as images, stylesheets, and client-side JavaScript files.
- `admin/`: Contains the admin panel functionality.

## Technologies Used

- **Express.js**: Web framework for Node.js used for building the backend server.
- **MongoDB**: NoSQL database used for storing product data and order information.
- **Node.js**: JavaScript runtime environment used for running the backend server.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.


