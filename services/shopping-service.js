const ShoppingRepository = require('../database/repository/shopping-repository');
const { FormatData } = require('../utils');
const { PublishMessage } = require('../utils');

class ShoppingService {
    constructor(channel) {
        this.repository = new ShoppingRepository();
        this.channel = channel;
    }

    // Get cart
    async GetCart(customerId) {
        try {
            const cartItems = await this.repository.Cart(customerId);
            return FormatData(cartItems);
        } catch (err) {
            throw new Error('Error getting cart: ' + err.message);
        }
    }

    // Add to cart
    async AddToCart(customerId, productData, quantity) {
        try {
            if (!productData || !productData.id || !quantity) {
                throw new Error('Invalid product data or quantity');
            }

            // Ensure quantity is a positive number
            const qty = parseInt(quantity);
            if (isNaN(qty) || qty <= 0) {
                throw new Error('Quantity must be a positive number');
            }

            const cartResult = await this.repository.AddCartItem(customerId, productData, qty);
            return FormatData(cartResult);
        } catch (err) {
            throw new Error('Error adding to cart: ' + err.message);
        }
    }

    // Remove from cart
    async RemoveFromCart(customerId, productId) {
        try {
            if (!productId) {
                throw new Error('Product ID is required');
            }

            const cartResult = await this.repository.RemoveCartItem(customerId, productId);
            return FormatData(cartResult);
        } catch (err) {
            throw new Error('Error removing from cart: ' + err.message);
        }
    }

    // Create order
    async CreateOrder(customerId) {
        try {
            if (!customerId) {
                throw new Error('Customer ID is required');
            }

            const cart = await this.repository.Cart(customerId);
            
            if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }

            // Create the order
            const order = await this.repository.CreateOrder(customerId, cart);

            // Publish order created event
            if (this.channel) {
                const msg = {
                    event: 'ORDER_CREATED',
                    data: { 
                        userId: customerId, 
                        order: {
                            orderId: order.orderId,
                            items: order.items,
                            total: order.amount
                        }
                    }
                };
                PublishMessage(this.channel, process.env.SHOPPING_BINDING_KEY, JSON.stringify(msg));
            }

            return FormatData(order);
        } catch (err) {
            throw new Error('Error creating order: ' + err.message);
        }
    }

    // Get orders
    async GetOrders(customerId) {
        try {
            if (!customerId) {
                throw new Error('Customer ID is required');
            }

            const orders = await this.repository.Orders(customerId);
            return FormatData(orders);
        } catch (err) {
            throw new Error('Error getting orders: ' + err.message);
        }
    }

    // Get order by ID
    async GetOrder(orderId) {
        try {
            if (!orderId) {
                throw new Error('Order ID is required');
            }

            const order = await this.repository.GetOrderById(orderId);
            return FormatData(order);
        } catch (err) {
            throw new Error('Error getting order: ' + err.message);
        }
    }
}

module.exports = ShoppingService;
