const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class LocalCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(dataDir, `${name}.json`);
    this.items = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error(`Error loading local DB collection ${this.name}:`, err.message);
    }
    return [];
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error saving local DB collection ${this.name}:`, err.message);
    }
  }

  generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  matches(item, filter = {}) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const key of Object.keys(filter)) {
      if (key === '_id') {
        const filterVal = String(filter[key]);
        const itemVal = String(item._id || item.id);
        if (filterVal !== itemVal) return false;
        continue;
      }
      if (key === '$or') {
        const orClauses = filter['$or'];
        const matchedOr = orClauses.some(clause => this.matches(item, clause));
        if (!matchedOr) return false;
        continue;
      }
      const val = filter[key];
      if (val instanceof RegExp) {
        if (!val.test(String(item[key] || ''))) return false;
      } else if (typeof val === 'object' && val !== null) {
        if (val.$in && Array.isArray(val.$in)) {
          const itemVal = item[key];
          if (Array.isArray(itemVal)) {
            if (!itemVal.some(v => val.$in.includes(v))) return false;
          } else {
            if (!val.$in.map(String).includes(String(itemVal))) return false;
          }
        }
      } else if (item[key] !== val) {
        return false;
      }
    }
    return true;
  }

  async find(filter = {}) {
    this.items = this.load();
    const results = this.items.filter(item => this.matches(item, filter));
    return results.map(item => this.wrap(item));
  }

  async findOne(filter = {}) {
    this.items = this.load();
    const item = this.items.find(item => this.matches(item, filter));
    return item ? this.wrap(item) : null;
  }

  async findById(id) {
    if (!id) return null;
    this.items = this.load();
    const strId = String(id);
    const item = this.items.find(item => String(item._id) === strId || String(item.id) === strId);
    return item ? this.wrap(item) : null;
  }

  async create(data) {
    this.items = this.load();
    const doc = {
      _id: data._id || this.generateId(),
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.items.push(doc);
    this.save();
    return this.wrap(doc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    this.items = this.load();
    const strId = String(id);
    const idx = this.items.findIndex(item => String(item._id) === strId || String(item.id) === strId);
    if (idx === -1) return null;

    let updatedDoc = { ...this.items[idx] };
    const payload = update.$set ? { ...update, ...update.$set } : update;
    delete payload.$set;

    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        if (!Array.isArray(updatedDoc[k])) updatedDoc[k] = [];
        updatedDoc[k].push(v);
      }
      delete payload.$push;
    }

    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        updatedDoc[k] = (updatedDoc[k] || 0) + v;
      }
      delete payload.$inc;
    }

    updatedDoc = { ...updatedDoc, ...payload, updatedAt: new Date().toISOString() };
    this.items[idx] = updatedDoc;
    this.save();
    return this.wrap(updatedDoc);
  }

  async findByIdAndDelete(id) {
    this.items = this.load();
    const strId = String(id);
    const idx = this.items.findIndex(item => String(item._id) === strId || String(item.id) === strId);
    if (idx === -1) return null;
    const deleted = this.items.splice(idx, 1)[0];
    this.save();
    return this.wrap(deleted);
  }

  async countDocuments(filter = {}) {
    this.items = this.load();
    return this.items.filter(item => this.matches(item, filter)).length;
  }

  wrap(item) {
    if (!item) return null;
    const self = this;
    const cloned = JSON.parse(JSON.stringify(item));
    cloned.save = async function() {
      self.items = self.load();
      const strId = String(this._id);
      const idx = self.items.findIndex(i => String(i._id) === strId);
      if (idx !== -1) {
        self.items[idx] = { ...this, updatedAt: new Date().toISOString() };
      } else {
        self.items.push(this);
      }
      self.save();
      return self.wrap(this);
    };
    return cloned;
  }
}

const collections = {};
function getCollection(name) {
  if (!collections[name]) {
    collections[name] = new LocalCollection(name);
  }
  return collections[name];
}

module.exports = { getCollection, LocalCollection };
