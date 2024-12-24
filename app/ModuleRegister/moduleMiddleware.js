const moduleMiddleware = (moduleData, routeData) => (req, res, next) => {
req.moduleInfo = moduleData; //module install data
req.routeData = routeData; //module route data 
next();
};
export default moduleMiddleware;