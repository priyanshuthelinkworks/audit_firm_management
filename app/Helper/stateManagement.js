import  EventEmitter from  'events';

class State extends EventEmitter {
  constructor() {
    super();
    this.state = {};
  }

  // Get the entire state
  getState() {
    return this.state;
  }

  // Get a specific property from the state
  getProperty(propertyName) {
    return this.state[propertyName];
  }

  // Set a property in the state
  setProperty(propertyName, value) {
    this.state[propertyName] = value;
    this.emit(`changed:${propertyName}`, value);
    this.emit('changed', propertyName, value);
  }

  // Update a property in the state
  updateProperty(propertyName, callback) {
    this.state[propertyName] = callback(this.state[propertyName]);
    this.emit(`changed:${propertyName}`, this.state[propertyName]);
    this.emit('changed', propertyName, this.state[propertyName]);
  }

  // Listen for changes to a specific property
  onChange(propertyName, callback) {
    this.on(`changed:${propertyName}`, callback);
  }

  // Listen for any changes to the state
  onAnyChange(callback) {
    this.on('changed', callback);
  }
}

module.exports = new State();

// const state = require('./state');

// // Set initial value
// state.setProperty('userData', { name: 'John Doe', email: 'john@example.com' });

// // Listen for changes to userData
// state.onChange('userData', (newValue) => {
//   console.log('userData changed:', newValue);
// });

// // Listen for any changes to the state
// state.onAnyChange((propertyName, newValue) => {
//   console.log(`State changed: ${propertyName} = ${JSON.stringify(newValue)}`);
// });

// // Update userData
// state.updateProperty('userData', (userData) => {
//   userData.name = 'Jane Doe';
//   return userData;
// });

// // Set new property
// state.setProperty('newProperty', 'Hello World');