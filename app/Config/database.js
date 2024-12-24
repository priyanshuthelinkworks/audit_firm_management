import Sequelize from "sequelize";
import 'dotenv/config'
console.log("process.env.PGDB_URI",process.env.PGDB_URI);
const sequelize = new Sequelize(process.env.PGDB_URI,{
        timezone: '+05:30',
    }
);


export default sequelize;
