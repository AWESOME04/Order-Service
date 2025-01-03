const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { v4: uuidv4 } = require('uuid');

class ShoppingRepository {
    // Get all orders for a customer
    async Orders(customerId) {
        try {
            return await Order.findAll({
                where: { customerId },
                order: [['created_at', 'DESC']]
            });
        } catch (err) {
            console.error('Error fetching orders:', err);
            throw err;
        }
    }

    // Get cart for a customer
    async Cart(customerId) {
        try {
            const cart = await Cart.findOne({
                where: { customerId }
            });
            return cart || { items: [] };
        } catch (err) {
            console.error('Error fetching cart:', err);
            throw err;
        }
    }

    // Add or update cart item
    async AddCartItem(customerId, item, quantity) {
        try {
            let cart = await Cart.findOne({
                where: { customerId }
            });

            let items = [];
            if (cart) {
                items = Array.isArray(cart.items) ? cart.items : [];
                const existingItemIndex = items.findIndex(i => i.productId === item.id);

                if (existingItemIndex >= 0) {
                    // Update existing item quantity
                    items[existingItemIndex].quantity = quantity;
                } else {
                    // Add new item
                    items.push({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: quantity
                    });
                }

                await cart.update({ items });
            } else {
                // Create new cart with first item
                cart = await Cart.create({
                    customerId,
                    items: [{
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: quantity
                    }]
                });
            }

            return cart;
        } catch (err) {
            console.error('Error adding cart item:', err);
            throw err;
        }
    }

    // Remove item from cart
    async RemoveCartItem(customerId, productId) {
        try {
            const cart = await Cart.findOne({
                where: { customerId }
            });

            if (cart && Array.isArray(cart.items)) {
                const items = cart.items.filter(item => item.productId !== productId);
                await cart.update({ items });
            }

            return cart;
        } catch (err) {
            console.error('Error removing cart item:', err);
            throw err;
        }
    }

    // Create order from cart
    async CreateOrder(customerId, cart) {
        try {
            if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }

            const total = cart.items.reduce((sum, item) => {
                return sum + (parseFloat(item.price) * parseInt(item.quantity));
            }, 0);

            // Create the order
            const order = await Order.create({
                orderId: uuidv4(),
                customerId,
                amount: total,
                status: 'pending',
                items: cart.items
            });

            // Clear the cart after successful order creation
            await Cart.destroy({
                where: { customerId }
            });

            return order;
        } catch (err) {
            console.error('Error creating order:', err);
            throw err;
        }
    }

    // Get order by ID
    async GetOrderById(orderId) {
        try {
            return await Order.findOne({
                where: { orderId }
            });
        } catch (err) {
            console.error('Error fetching order:', err);
            throw err;
        }
    }
}

module.exports = ShoppingRepository;
