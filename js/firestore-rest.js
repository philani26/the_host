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
    get(){
      return this.store.request('GET', this.path())
        .then(response => ({ exists: !!response.fields, id: this.id, data: () => decodeFields(response.fields || {}) }))
        .catch(err => {
          if (err.notFound) return { exists: false, id: this.id, data: () => ({}) };
          throw err;
        });
    }
    set(data, options){ return this.store.commit([{ type: 'set', path: this.path(), data, merge: !!(options && options.merge) }]); }
    update(data){ return this.store.commit([{ type: 'update', path: this.path(), data }]); }
    delete(){ return this.store.request('DELETE', this.path()); }
    path(){ return `${this.collection}/${encodeURIComponent(this.id)}`; }
  }

  const QUERY_OPS = {
    '==': 'EQUAL', '!=': 'NOT_EQUAL', '<': 'LESS_THAN', '<=': 'LESS_THAN_OR_EQUAL',
    '>': 'GREATER_THAN', '>=': 'GREATER_THAN_OR_EQUAL', 'array-contains': 'ARRAY_CONTAINS',
    'in': 'IN', 'array-contains-any': 'ARRAY_CONTAINS_ANY'
  };

  function runQueryDocs(store, structuredQuery){
    return store.request('POST', ':runQuery', { structuredQuery }).then(response => ({
      docs: (Array.isArray(response) ? response : [])
        .filter(item => item.document)
        .map(item => {
          const id = item.document.name.split('/').pop();
          return { id, data: () => decodeFields(item.document.fields || {}) };
        })
    }));
  }

  class RestQuery {
    constructor(store, collectionId, filters){ this.store = store; this.collectionId = collectionId; this.filters = filters; }
    where(field, op, value){
      return new RestQuery(this.store, this.collectionId, [...this.filters, { field, op, value }]);
    }
    get(){
      const fieldFilters = this.filters.map(f => ({
        fieldFilter: { field: { fieldPath: f.field }, op: QUERY_OPS[f.op] || 'EQUAL', value: encodeValue(f.value) }
      }));
      const structuredQuery = { from: [{ collectionId: this.collectionId }] };
      if (fieldFilters.length === 1) structuredQuery.where = fieldFilters[0];
      else if (fieldFilters.length > 1) structuredQuery.where = { compositeFilter: { op: 'AND', filters: fieldFilters } };
      return runQueryDocs(this.store, structuredQuery);
    }
  }

  class RestCollection {
    constructor(store, name){ this.store = store; this.name = name; }
    get(){
      return this.store.request('GET', this.name).then(response => ({ docs: (response.documents || []).map(document => {
        const id = document.name.split('/').pop();
        return { id, data: () => decodeFields(document.fields || {}) };
      }) }));
    }
    where(field, op, value){ return new RestQuery(this.store, this.name, []).where(field, op, value); }
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
      this.resourceBase = `projects/${config.projectId}/databases/(default)/documents`;
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
        const err = new Error(error.error?.message || `Firestore request failed (${response.status})`);
        if (response.status === 404) err.notFound = true;
        throw err;
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
