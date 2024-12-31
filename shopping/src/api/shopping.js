const ShoppingService = require("../services/shopping-service");
const UserAuth = require('./middlewares/auth');
const { PublishCustomerEvents } = require("../utils");
const {SubscribeMessage, PublishMessage} = require("../utils")
const  {SHOPPING_BINDING_KEY,CUSTOMER_BINDING_KEY} = require("../config")


module.exports = (app,channel) => {
    
    const service = new ShoppingService();
     SubscribeMessage(channel,service);

    app.post('/order',UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        const { txnNumber } = req.body;


        try {
            const { data } = await service.PlaceOrder({_id, txnNumber});

            const payload = await service.GetOrderPayload(_id,data,'CREATE_ORDER')
            //PublishCustomerEvents(payload);
            PublishMessage(channel,CUSTOMER_BINDING_KEY,JSON.stringify(payload))
            return res.status(200).json(data);
            
        } catch (err) {
            next(err)
        }

    });

    app.get('/orders',UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        console.log("\n get order cid: "+ _id)

        try {
            const { data } = await service.GetOrders(_id);
            console.log("\n\n=========>received data: "+ JSON.stringify(data))
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }

    });
       
    
    app.get('/cart', UserAuth, async (req,res,next) => {

        const { _id } = req.user;
        console.log("\n get cart cid: "+ _id)
        try {
            const { data } = await service.GetCart(_id);
            return res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    });
}