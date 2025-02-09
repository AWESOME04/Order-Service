const ShoppingRepository = require("../database/repository/shopping-repository");
const { FormatData } = require("../utils");
const { PublishMessage } = require('../utils');
const axios = require('axios');

class ShoppingService {
  constructor(channel) {
    this.channel = channel;
    this.repository = new ShoppingRepository();
    // Initialize product service URL from environment variable
    this.productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'https://product-service-qwti.onrender.com';
  }

  async GetProductById(productId) {
    try {
      const response = await axios.get(`${this.productServiceUrl}/products/${productId}`);
      return response.data;
    } catch (err) {
      console.error('Error fetching product:', err);
      return null;
    }
  }

  async GetCart(customerId) {
    try {
      const cart = await this.repository.Cart(customerId);
      const cartItems = cart.items || [];
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return FormatData({ items: cartItems, total });
    } catch (err) {
      throw new Error('Error fetching cart');
    }
  }

  async AddToCart(customerId, product) {
    try {
      if (!customerId || !product || !product.id) {
        throw new Error('Invalid input data');
      }

      const cartItem = {
        customerId: String(customerId), // Ensure customerId is a string
        productId: String(product.id), // Ensure productId is a string
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.image || product.img
      };

      console.log('Adding to cart:', cartItem);

      const cart = await this.repository.AddCartItem(cartItem);

      // Publish message to update product stock
      await PublishMessage(this.channel, 'PRODUCT_SERVICE', JSON.stringify({
        event: 'UPDATE_PRODUCT_STOCK',
        data: {
          productId: product.id,
          quantityChange: -1
        }
      }));

      return FormatData(cart);
    } catch (err) {
      console.error('Error in AddToCart:', err);
      throw new Error(err.message || 'Error adding to cart');
    }
  }

  async RemoveFromCart(customerId, productId) {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      const cart = await this.repository.RemoveCartItem(customerId, productId);
      const cartItems = cart.items || [];
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return FormatData({ items: cartItems, total });
    } catch (err) {
      throw new Error('Error removing from cart');
    }
  }

  async UpdateCartQuantity(customerId, productId, quantity) {
    try {
      if (!productId || !quantity) {
        throw new Error('Product ID and quantity are required');
      }

      // Ensure quantity is a positive number
      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new Error('Quantity must be a positive number');
      }

      const cart = await this.repository.UpdateCartItemQuantity(customerId, productId, qty);
      const cartItems = cart.items || [];
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return FormatData({ items: cartItems, total });
    } catch (err) {
      throw new Error(err.message || 'Error updating cart quantity');
    }
  }

  async ClearCart(customerId) {
    try {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      await this.repository.ClearCart(customerId);
      return FormatData({ items: [], total: 0 });
    } catch (err) {
      throw new Error('Error clearing cart');
    }
  }

  async CreateOrder(customerId, orderData) {
    try {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const cart = await this.repository.Cart(customerId);
      
      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const order = await this.repository.CreateOrder(customerId, cart.items);

      // Clear the cart after successful order creation
      await this.repository.ClearCart(customerId);

      // Publish ORDER_CREATED event
      const orderCreatedPayload = {
        event: 'ORDER_CREATED',
        data: {
          userId: customerId,
          order: {
            orderId: order.id,
            items: cart.items,
            total: total
          }
        }
      };

      await PublishMessage(this.channel, 'NOTIFICATION_SERVICE', JSON.stringify(orderCreatedPayload));
      console.log('Published ORDER_CREATED event:', orderCreatedPayload);

      return FormatData(order);
    } catch (err) {
      throw new Error(err.message || 'Error creating order');
    }
  }

  async GetOrders(customerId) {
    try {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      const orders = await this.repository.GetOrders(customerId);
      return FormatData(orders);
    } catch (err) {
      throw new Error('Error fetching orders');
    }
  }

  async GetOrder(orderId) {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const order = await this.repository.GetOrderById(orderId);
      return FormatData(order);
    } catch (err) {
      throw new Error('Error fetching order');
    }
  }
}

module.exports = ShoppingService;
