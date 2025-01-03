const ShoppingService = require('../services/shopping-service');
const { auth, isBuyer } = require('./middleware/auth');
const { PublishMessage } = require('../utils');

module.exports = (app, channel) => {
    const service = new ShoppingService(channel);

    // Get cart
    app.get('/cart', auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.GetCart(req.user._id);
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Add to cart
    app.post('/cart', auth, isBuyer, async (req, res, next) => {
        try {
            const { productId, name, price, quantity } = req.body;
            
            if (!productId || !name || !price || !quantity || quantity <= 0) {
                return res.status(400).json({ message: 'Invalid product data' });
            }

            const { data } = await service.AddToCart(
                req.user._id,
                { id: productId, name, price },
                quantity
            );

            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Remove from cart
    app.delete('/cart/:productId', auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.RemoveFromCart(
                req.user._id,
                parseInt(req.params.productId)
            );
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });

    // Create order (checkout)
    app.post('/order', auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.CreateOrder(req.user._id);
            return res.status(201).json(data);
        } catch (err) {
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

    // Get specific order
    app.get('/order/:orderId', auth, isBuyer, async (req, res, next) => {
        try {
            const { data } = await service.GetOrder(req.params.orderId);
            
            if (!data) {
                return res.status(404).json({ message: 'Order not found' });
            }

            // Ensure user can only access their own orders
            if (data.customerId !== req.user._id) {
                return res.status(403).json({ message: 'Not authorized to view this order' });
            }

            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });
};