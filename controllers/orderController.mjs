import Orders from '../models/orderModel.mjs';

const getOrder = async (req,res) => {
    
    try {
        res.render('user/orders');
    } catch (error) {
        
    }
};

export {getOrder};