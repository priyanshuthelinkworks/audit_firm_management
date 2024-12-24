
import sequelize from "#wms/Config/database";

class Store_Procedure {

  static UDSP_RPT_IBCTDETL01 = async () => {
    try {
      let company = 117;
      let whse = 67890;
      let reportdb = 'wms_dashboard_report';
      console.log('Procedure function triggered UDSP_RPT_IBCTDETL01')

      const query = `CALL "UDSP_RPT_IBCTDETL01"(:company, :whse, :reportdb )`;
      await sequelize.query(query, {
        replacements: { company, whse, reportdb },
      });
      console.log('Function called successfully');
    } catch (error) {
      console.error('Unable to connect to the database or execute the function:', error);
    }
  };
  static UDSP_RPT_GOCTDETL01 = async () => {
    try {
      let company = 117;
      let whse = 67890;
      let reportdb = 'wms_dashboard_report';
      console.log('Procedure function triggered UDSP_RPT_GOCTDETL01')

      const query = `CALL "UDSP_RPT_GOCTDETL01"(:company, :whse, :reportdb )`;
      await sequelize.query(query, {
        replacements: { company, whse, reportdb },
      });
      console.log('Function called successfully');
    } catch (error) {
      console.error('Unable to connect to the database or execute the function:', error);
    }
  };

  static UDSP_RPT_IBCTSTATUS01 = async () => {
    try {
      let company = 117;
      let whse = 67890;
      let reportdb = 'wms_dashboard_report';
      console.log('Procedure function triggered UDSP_RPT_IBCTSTATUS01')

      const query = `CALL "UDSP_RPT_IBCTSTATUS01"(:company, :whse, :reportdb )`;
      await sequelize.query(query, {
        replacements: { company, whse, reportdb },
      });
      console.log('Function called successfully');
    } catch (error) {
      console.error('Unable to connect to the database or execute the function:', error);
    }
  };
  static UDSP_RPT_LOCUTLOG01 = async () => {
    try {
      let company = 117;
      let whse = 67890;
      let reportdb = 'wms_dashboard_report';
      console.log('Procedure function triggered UDSP_RPT_LOCUTLOG01')

      const query = `CALL "UDSP_RPT_LOCUTLOG01"(:company, :whse, :reportdb )`;
      await sequelize.query(query, {
        replacements: { company, whse, reportdb },
      });
      console.log('Function called successfully');
    } catch (error) {
      console.error('Unable to connect to the database or execute the function:', error);
    }
  };
  static INBOUND_Procedure = async () => {
    try {
      this.UDSP_RPT_IBCTSTATUS01();
      this.UDSP_RPT_LOCUTLOG01 ();
       this.UDSP_RPT_IBCTDETL01 ();
        this.UDSP_RPT_GOCTDETL01 ();

    } catch (error) {
      console.error('Unable to connect to the database or execute the function:', error);
    }
  };

}
setInterval(Store_Procedure.INBOUND_Procedure, 15 * 60 * 1000)
Store_Procedure.INBOUND_Procedure()
export default Store_Procedure;
