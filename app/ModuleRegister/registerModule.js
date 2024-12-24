
class Module {

    constructor() {
        this.map = new Map();
    }
    register(key, value) {
        this.map.set(key, value);
    }
    list () {
        this.map.forEach((value,key)=>{
            console.log(`module installed -- ${key}`)
        })
    }
    has(key) {
        return this.map.has(key);
    }
    delete(key) {
        return this.map.delete(key);
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