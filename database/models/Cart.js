const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'carts'
});

module.exports = Cart;
