const { DataTypes } = require('sequelize');
const sequelize = require('../connection');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'carts'
});

module.exports = Cart;
