
class Module {
  constructor() {
    this.schemaMap = new Map();
    this.installedModel = new Map();
    this.relations = [];
  }
  get map() {
    return this.schemaMap;
  }
  getModel(key) {
    //console.log("k",key);
    
    return this.installedModel.get(key);
  }
  getSchema(key) {
    return this.schemaMap.get(key);
  }
  register(value) {
   // console.log(`module ${key} is registered with value`, value)
    this.installedModel.set(value.name, value.model);
    if(value.registerRelations)
    this.relations.push(value.registerRelations);
  }
  install() {
    this.relations.forEach((item)=> {
      item();
    })
  }
  list() {
    this.installedModel.forEach((value, key) => {
      console.log(`Model loaded -- ${key}`);
    });
  }
  has(key) {
    return this.schemaMap.has(key);
  }
  delete(key) {
    return this.schemaMap.delete(key);
  }
}

class Singleton {
  constructor() {
    if (!Singleton.instance) {
      Singleton.instance = new Module();
    }
  }

  getInstance() {
    return Singleton.instance;
  }
}

export default new Singleton().getInstance();