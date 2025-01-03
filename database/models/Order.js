const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.STRING,
    unique: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  items: {
    type: DataTypes.JSON
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'orders'
});

module.exports = Order;
