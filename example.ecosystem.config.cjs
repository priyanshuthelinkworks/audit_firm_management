module.exports = {
    apps: [
      {
        name: "LinkworkAi Backend",
        script: "Index.js", // Use .mjs extension for ES modules
        instances: 1,
        exec_mode: "fork",
        cwd: "/var/www/html/wms-backend/app", // Replace this with the actual path to your application
    //    node_args: "--experimental-modules --max-old-space-size=7168", // Enable experimental-modules flag
        //max_memory_restart: "450M",
        //error_file: "/dev/null",
        env: {
          NODE_ENV: "development",
          PORT: 7001,
          APPLICATION_SECRET: "WMS Backend",
          PGDB_URI:"postgresql://postgres:linkworkai@13.127.119.81/LinkworkAi",
          tour_wms:"postgresql://scmwms:scmwms@scm.thelinkworks.com/tour_wms"
         
        },
        
      },
    ],
  };
  