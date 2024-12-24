
class MiddlewareRegister {

    constructor() {
        this.map = new Map();
    }
    list () {
        this.map.forEach((value,key)=>{
            console.log(`middleware Registered -- ${key}, ${value}`)
        })
    }
    get(key) {
        if(this.map.has(key))
        return this.map.get(key);
    else
    console.log('middleware not found')
    }
    register(key, value) {
        // console.log(`module ${key} is registered with value`, value)
        this.map.set(key, value);
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
          Singleton.instance = new MiddlewareRegister();
      }
  }

  getInstance() {
      return Singleton.instance;
  }

}

export default new Singleton().getInstance();