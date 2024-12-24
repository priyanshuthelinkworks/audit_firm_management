
export  default[
  {
    name:"Auth",
    type:"Auth",
    include:['model','coreRoutes'],
    description:'Auth',
    appendMiddleware:[]
  },
  {
    name: "Authorize",
    include: ["middleware"],
    description: "Secure route middleware",
    packageDepdency: ["jwt"],
  },
  
  
];



