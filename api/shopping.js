const ShoppingService = require('../services/shopping-service');
const { auth, isBuyer } = require('./middleware/auth');
const { PublishMessage } = require('../utils');
const nodemailer = require('nodemailer');

module.exports = (app, channel) => {
    const service = new ShoppingService(channel);

    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    // Verify transporter
    transporter.verify(function (error, success) {
        if (error) {
            console.log("Error verifying email transporter:", error);
        } else {
            console.log("Email server is ready to send messages");
        }
    });

    // Add CORS headers middleware
    const addCorsHeaders = (req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for testing
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        res.header('Access-Control-Allow-Credentials', 'true');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    };

    // Get cart
    app.get('/cart', addCorsHeaders, auth, isBuyer, async (req, res, next) => {
        try {
            const userId = req.user._id || req.user.id;
            console.log('Getting cart for user:', userId); // Debug log
            
            const { data } = await service.GetCart(userId);
            return res.status(200).json(data);
        } catch (err) {
            console.error('Error getting cart:', err);
            next(err);
        }
    });

    // Add to cart
    app.post('/cart', addCorsHeaders, auth, isBuyer, async (req, res, next) => {
        try {
            console.log('Add to cart request:', {
                body: req.body,
                user: req.user,
                headers: req.headers
            });
            
            const { productId, name, price, quantity = 1, image } = req.body;
            const userId = req.user._id || req.user.id;
            
            // Validate required fields
            const missingFields = [];
            if (!productId) missingFields.push('productId');
            if (!name) missingFields.push('name');
            if (!price) missingFields.push('price');
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    fields: missingFields
                });
            }

            const { data } = await service.AddToCart(userId, {
                id: productId,
                name,
                price: parseFloat(price),
                image
            }, parseInt(quantity) || 1);

            return res.status(200).json(data);
        } catch (err) {
            console.error('Error adding to cart:', err);
            next(err);
        }
    });

    // Update cart quantity
    app.patch('/cart/:productId', addCorsHeaders, auth, isBuyer, async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { quantity } = req.body;
            const userId = req.user._id || req.user.id;
            
            if (!quantity) {
                return res.status(400).json({ 
                    message: 'Quantity is required' 
                });
            }

            if (quantity < 1) {
                return res.status(400).json({ 
                    message: 'Quantity must be at least 1' 
                });
            }

            const { data } = await service.UpdateCartQuantity(userId, productId, quantity);
            return res.status(200).json(data);
        } catch (err) {
            console.error('Update cart error:', err);
            next(err);
        }
    });

    // Remove from cart
    app.delete('/cart/:productId', addCorsHeaders, auth, isBuyer, async (req, res, next) => {
        try {
            const userId = req.user._id || req.user.id;
            const { productId } = req.params;
            const { data } = await service.RemoveFromCart(userId, productId);
            return res.status(200).json(data);
        } catch (err) {
            console.error('Remove from cart error:', err);
            next(err);
        }
    });

    // Clear cart
    app.delete('/cart', addCorsHeaders, auth, isBuyer, async (req, res, next) => {
        try {
            const userId = req.user._id || req.user.id;
            const { data } = await service.ClearCart(userId);
            return res.status(200).json(data);
        } catch (err) {
            console.error('Clear cart error:', err);
            next(err);
        }
    });

    // Get all orders
    app.get('/orders', addCorsHeaders, auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.GetOrders(req.user._id);
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Get order by ID
    app.get('/orders/:orderId', addCorsHeaders, auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.GetOrder(req.params.orderId);
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Create order
    app.post('/orders', addCorsHeaders, auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.CreateOrder(req.user._id, req.body);
            return res.status(201).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Send order confirmation email
    app.post('/send-order-email', addCorsHeaders, async (req, res) => {
        try {
            const { email, orderDetails } = req.body;

            // Send email with improved headers
            const info = await transporter.sendMail({
                from: {
                    name: "MultiVendor Shop",
                    address: process.env.GMAIL_USER
                },
                to: email,
                subject: 'Order Confirmation - Your Order Has Been Placed!',
                html: orderDetails,
                headers: {
                    'List-Unsubscribe': `<mailto:${process.env.GMAIL_USER}?subject=unsubscribe>`,
                    'Precedence': 'bulk',
                    'X-Auto-Response-Suppress': 'OOF, AutoReply'
                }
            });

            console.log('Email sent:', info.messageId);

            res.json({ 
                success: true, 
                messageId: info.messageId
            });
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: error.message || 'Failed to send email' });
        }
    });

    // In your error handling middleware or route handler
    app.use((err, req, res, next) => {
        console.error('Shopping service error:', err);
        res.status(400).json({
            message: err.message,
            details: err.stack
        });
    });
};