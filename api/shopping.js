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
            user: process.env.GMAIL_USER, // Your Gmail address
            pass: process.env.GMAIL_APP_PASSWORD // Your Gmail App Password
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

    // Get cart
    app.get('/cart', auth, isBuyer, async (req, res, next) => {
        try {
            const userId = req.user._id || req.user.id; // Handle both _id and id
            const { data } = await service.GetCart(userId);
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Add to cart
    app.post('/cart', auth, isBuyer, async (req, res, next) => {
        try {
            console.log('Received cart request body:', req.body); // Debug log
            
            const { productId, name, price, quantity = 1, image } = req.body;
            const userId = req.user._id || req.user.id;
            
            // Validate required fields
            const missingFields = [];
            if (!productId) missingFields.push('productId');
            if (!name) missingFields.push('name');
            if (!price) missingFields.push('price');
            
            if (missingFields.length > 0) {
                console.error('Missing fields in request:', missingFields);
                return res.status(400).json({ 
                    message: `Missing required fields: ${missingFields.join(', ')}`,
                    receivedData: req.body
                });
            }

            const { data } = await service.AddToCart(
                userId,
                { 
                    id: productId, 
                    name, 
                    price: parseFloat(price), 
                    image 
                },
                parseInt(quantity) || 1
            );

            return res.status(200).json(data);
        } catch (err) {
            console.error('Add to cart error:', err);
            if (err.message) {
                return res.status(400).json({ 
                    message: err.message,
                    error: err.stack
                });
            }
            next(err);
        }
    });

    // Update cart quantity
    app.patch('/cart/:productId', auth, isBuyer, async (req, res, next) => {
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
            if (err.message) {
                return res.status(400).json({ message: err.message });
            }
            next(err);
        }
    });

    // Remove from cart
    app.delete('/cart/:productId', auth, isBuyer, async (req, res, next) => {
        try {
            const userId = req.user._id || req.user.id;
            const { productId } = req.params;
            const { data } = await service.RemoveFromCart(userId, productId);
            return res.status(200).json(data);
        } catch (err) {
            console.error('Remove from cart error:', err);
            if (err.message) {
                return res.status(400).json({ message: err.message });
            }
            next(err);
        }
    });

    // Clear cart
    app.delete('/cart', auth, isBuyer, async (req, res, next) => {
        try {
            const userId = req.user._id || req.user.id;
            const { data } = await service.ClearCart(userId);
            return res.status(200).json(data);
        } catch (err) {
            console.error('Clear cart error:', err);
            if (err.message) {
                return res.status(400).json({ message: err.message });
            }
            next(err);
        }
    });

    // Get all orders
    app.get('/orders', auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.GetOrders(req.user._id);
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Get order by ID
    app.get('/orders/:orderId', auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.GetOrder(req.params.orderId);
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Create order
    app.post('/orders', auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.CreateOrder(req.user._id, req.body);
            return res.status(201).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Send order confirmation email
    app.post('/send-order-email', async (req, res) => {
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