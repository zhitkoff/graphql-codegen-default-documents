function autoBind(self, { include, exclude } = {}) {
  const matches = (key) => {
    const match = (pattern) => typeof pattern === 'string' ? key === pattern : pattern.test(key);

    if (include) {
      return include.some(match);
    }

    if (exclude) {
      return !exclude.some(match);
    }

    return true;
  };

  for (let object = self.constructor.prototype; object && object !== Object.prototype; object = Object.getPrototypeOf(object)) {
    for (const key of Reflect.ownKeys(object)) {
      if (key === 'constructor' || !matches(key)) {
        continue;
      }

      const descriptor = Reflect.getOwnPropertyDescriptor(object, key);
      if (descriptor && typeof descriptor.value === 'function') {
        self[key] = self[key].bind(self);
      }
    }
  }

  return self;
}

module.exports = { __esModule: true, default: autoBind };
