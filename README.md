# Order/Shopping Service - Multi-Vendor Platform

The **Order/Shopping Service** is a key microservice in the Multi-Vendor Platform, handling user shopping carts, order management, and email notifications. It facilitates seamless shopping experiences by managing cart operations, processing orders, and integrating with external email services for order confirmation.

---

## Features

- **Cart Management**:
  - Add, update, or remove items in the shopping cart.
  - Clear the entire cart.
  
- **Order Management**:
  - Place new orders.
  - Retrieve all orders or specific order details.

- **Email Notifications**:
  - Sends order confirmation emails with enhanced security headers.

- **CORS Support**:
  - Ensures cross-origin requests are properly handled for frontend integration.

---

## Technology Stack

- **Node.js**: Runtime environment.
- **Express.js**: Framework for creating REST APIs.
- **RabbitMQ**: Message queue for inter-service communication.
- **Nodemailer**: Email service for sending notifications.
- **JWT**: Secure token-based authentication.

---

## API Endpoints

### Cart Operations

1. **Get Cart**
   - **Endpoint**: `GET /cart`
   - **Description**: Retrieves the authenticated user's cart.
   - **Protected**: Yes
   - **Response**:
     ```json
     [
       {
         "productId": "123",
         "name": "Product A",
         "price": 100.0,
         "quantity": 2,
         "image": "https://example.com/image.jpg"
       },
       ...
     ]
     ```

2. **Add To Cart**
   - **Endpoint**: `POST /cart`
   - **Description**: Adds an item to the user's cart.
   - **Protected**: Yes
   - **Request Body**:
     ```json
     {
       "productId": "123",
       "name": "Product A",
       "price": 100.0,
       "quantity": 2,
       "image": "https://example.com/image.jpg"
     }
     ```
   - **Response**:
     ```json
     {
       "message": "Product added to cart.",
       "cart": { ... }
     }
     ```

3. **Update Cart Quantity**
   - **Endpoint**: `PATCH /cart/:productId`
   - **Description**: Updates the quantity of an item in the cart.
   - **Protected**: Yes
   - **Request Body**:
     ```json
     {
       "quantity": 3
     }
     ```
   - **Response**:
     ```json
     {
       "message": "Cart updated successfully.",
       "cart": { ... }
     }
     ```

4. **Remove From Cart**
   - **Endpoint**: `DELETE /cart/:productId`
   - **Description**: Removes an item from the user's cart.
   - **Protected**: Yes
   - **Response**:
     ```json
     {
       "message": "Product removed from cart."
     }
     ```

5. **Clear Cart**
   - **Endpoint**: `DELETE /cart`
   - **Description**: Clears all items in the user's cart.
   - **Protected**: Yes
   - **Response**:
     ```json
     {
       "message": "Cart cleared successfully."
     }
     ```

---

### Order Operations

6. **Get All Orders**
   - **Endpoint**: `GET /orders`
   - **Description**: Fetches all orders for the authenticated user.
   - **Protected**: Yes
   - **Response**:
     ```json
     [
       {
         "orderId": "456",
         "status": "confirmed",
         "items": [ ... ],
         "total": 300.0
       },
       ...
     ]
     ```

7. **Get Order By ID**
   - **Endpoint**: `GET /orders/:orderId`
   - **Description**: Retrieves details of a specific order.
   - **Protected**: Yes
   - **Response**:
     ```json
     {
       "orderId": "456",
       "status": "confirmed",
       "items": [ ... ],
       "total": 300.0
     }
     ```

8. **Create Order**
   - **Endpoint**: `POST /orders`
   - **Description**: Creates a new order from the user's cart.
   - **Protected**: Yes
   - **Request Body**:
     ```json
     {
       "items": [
         { "productId": "123", "quantity": 2 },
         { "productId": "456", "quantity": 1 }
       ],
       "total": 300.0
     }
     ```
   - **Response**:
     ```json
     {
       "message": "Order created successfully.",
       "order": { ... }
     }
     ```

---

### Email Notifications

9. **Send Order Confirmation Email**
   - **Endpoint**: `POST /send-order-email`
   - **Description**: Sends an email confirmation for an order.
   - **Request Body**:
     ```json
     {
       "email": "user@example.com",
       "orderDetails": "<p>Order confirmation details...</p>"
     }
     ```
   - **Response**:
     ```json
     {
       "success": true,
       "messageId": "email-message-id"
     }
     ```

---

## Inter-Service Communication

- **Event Publishing**:
  - Publishes order and cart events to RabbitMQ for integration with other microservices, such as the Notification Service.

---

## Setup and Installation

### Prerequisites

- **Node.js**: >=16.x
- **npm** or **yarn**
- **RabbitMQ**: For message queues.
- **Email Credentials**: Gmail account credentials for Nodemailer.

### Steps to Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/AWESOME04/Shopping-Service.git
   cd Order-Service
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - RabbitMQ URL.
   - Gmail credentials (`GMAIL_USER` and `GMAIL_APP_PASSWORD`).
4. Start the server:
   ```bash
   node index.js
   ```
   The service will run on `http://localhost:8003`.

---

## Deployment

- **Hosting**: Deployed on Render.
- **Message Queue**: RabbitMQ via CloudAMQP.
