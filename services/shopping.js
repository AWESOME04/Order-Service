const ShoppingService = require("../services/shopping-service");
const { PublishCustomerEvent, SubscribeMessage } = require("../utils");
const  auth = require('./middlewares/auth');
const { PublishMessage } = require('../utils')

shoppingRoutes = (app, channel) => {
    
    const service = new ShoppingService();

    SubscribeMessage(channel, service)

    app.post('/order',auth, async (req,res,next) => {

        const { _id } = req.user;
 
        const { data } = await service.PlaceOrder({_id});
        
        const payload = await service.GetOrderPayload(_id, data, 'CREATE_ORDER')
        const notificationPayload = await service.GetNotificationPayload(req.user.email, data, 'SEND_CHECKOUT_CONFIRMATION_MAIL')
        PublishMessage(channel,process.env.CUSTOMER_BINDING_KEY, JSON.stringify(payload))
        PublishMessage(channel,process.env.NOTIFICATION_BINDING_KEY, JSON.stringify(notificationPayload))

        res.status(200).json(data);

    });

    app.get('/orders',auth, async (req,res,next) => {

        const { _id } = req.user;

        const { data } = await service.GetOrders(_id);
        
        res.status(200).json(data);

    });

    app.put('/cart',auth, async (req,res,next) => {

        const { _id } = req.user;
        const {item,quantity,isRemove}=req.body

        const { data } = await service.ManageCart(_id,item,quantity,isRemove);
        
        res.status(200).json(data);

    });

    app.delete('/cart/:id',auth, async (req,res,next) => {

        const { _id } = req.user;


        const { data } = await service.ManageCart(_id,[],0,true);
        
        res.status(200).json(data);

    });
    
    app.get('/cart', auth, async (req,res,next) => {

        const { _id } = req.user;
        
        const { data } = await service.GetCart({ _id });

        return res.status(200).json(data);
    });

    app.get('/whoami', (req,res,next) => {
        return res.status(200).json({msg: '/shoping : I am Shopping Service'})
    })
 
}
module.exports=shoppingRoutes