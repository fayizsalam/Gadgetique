class ErrorHandler extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode=statusCode;
    }
}
const errorMiddleware=(err,req,res,next)=>{
    err.statusCode = err.statusCode || 500;
    err.message = err.message || `Internal Server Error`;
}

export {errorMiddleware}