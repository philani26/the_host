(function(){
  function encodeValue(value){
    if (value && value.__serverTimestamp) return null;
    if (value === null) return { nullValue: null };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
    if (value && typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
    return { nullValue: null };
  }

  function decodeValue(value){
    if (!value) return null;
    if ('nullValue' in value) return null;
    if ('stringValue' in value) return value.stringValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('timestampValue' in value) return new Date(value.timestampValue);
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
    if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
    return null;
  }

  function encodeFields(data){
    return Object.fromEntries(Object.entries(data || {}).filter(([, value]) => !(value && value.__serverTimestamp)).map(([key, value]) => [key, encodeValue(value)]));
  }

  function decodeFields(fields){
    return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decodeValue(value)]));
  }

  function serverTransforms(data){
    return Object.entries(data || {}).filter(([, value]) => value && value.__serverTimestamp).map(([fieldPath]) => ({ fieldPath, setToServerValue: 'REQUEST_TIME' }));
  }

  class RestDocument {
    constructor(store, collection, id){ this.store = store; this.collection = collection; this.id = id; }
    get(){ return this.store.request('GET', this.path()).then(response => ({ exists: !!response.fields, id: this.id, data: () => decodeFields(response.fields || {}) })); }
    set(data, options){ return this.store.commit([{ type: 'set', path: this.path(), data, merge: !!(options && options.merge) }]); }
    update(data){ return this.store.commit([{ type: 'update', path: this.path(), data }]); }
    delete(){ return this.store.request('DELETE', this.path()); }
    path(){ return `${this.collection}/${encodeURIComponent(this.id)}`; }
  }

  class RestCollection {
    constructor(store, name){ this.store = store; this.name = name; }
    get(){
      return this.store.request('GET', this.name).then(response => ({ docs: (response.documents || []).map(document => {
        const id = document.name.split('/').pop();
        return { id, data: () => decodeFields(document.fields || {}) };
      }) }));
    }
    add(data){
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      return this.doc(id).set(data).then(() => ({ id }));
    }
    doc(id){ return new RestDocument(this.store, this.name, id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`); }
  }

  class RestBatch {
    constructor(store){ this.store = store; this.operations = []; }
    set(ref, data){ this.operations.push({ type:'set', path:ref.path(), data }); return this; }
    update(ref, data){ this.operations.push({ type:'update', path:ref.path(), data }); return this; }
    commit(){ return this.store.commit(this.operations); }
  }

  class RestFirestore {
    constructor(config, auth){
      this.config = config;
      this.auth = auth;
      this.resourceBase = `projects/${config.projectId}/databases/default/documents`;
      this.base = `https://firestore.googleapis.com/v1/${this.resourceBase}`;
    }
    settings(){ return this; }
    collection(name){ return new RestCollection(this, name); }
    batch(){ return new RestBatch(this); }
    async headers(){
      const token = this.auth && this.auth.currentUser ? await this.auth.currentUser.getIdToken() : null;
      return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    }
    async request(method, path, body){
      const response = await fetch(`${this.base}/${path}?key=${this.config.apiKey}`, { method, headers: await this.headers(), body: body ? JSON.stringify(body) : undefined });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Firestore request failed (${response.status})`);
      }
      return response.status === 204 ? {} : response.json();
    }
    async commit(operations){
      const writes = operations.map(operation => {
        const fields = encodeFields(operation.data);
        const transforms = serverTransforms(operation.data);
        const write = { update: { name: `${this.resourceBase}/${operation.path}`, fields } };
        if (operation.type === 'update' || operation.merge) write.updateMask = { fieldPaths: Object.keys(operation.data).filter(field => !(operation.data[field] && operation.data[field].__serverTimestamp)) };
        if (transforms.length) write.updateTransforms = transforms;
        return write;
      });
      return this.request('POST', ':commit', { writes });
    }
  }

  window.RestFirestore = RestFirestore;
  window.restServerTimestamp = () => ({ __serverTimestamp: true });
})();
