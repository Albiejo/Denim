module.exports = {
    apps: [
      {
        name: 'Denim',
        script: 'index.js',
        env: {
          NODE_ENV: 'production',
          port: 3000,
          RAZORPAY_KEYID: 'rzp_test_76Sj5AYZSJlhWw',
          RAZORPAY_SECRET: 'nn6jbWCXzDnmvJQDpU1jpLzn'
        },
      },
    ],
  };
  