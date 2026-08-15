(function(){
  class RestStorage {
    constructor(config, auth){
      this.bucket = config.storageBucket;
      this.auth = auth;
    }
    async headers(){
      const token = this.auth && this.auth.currentUser ? await this.auth.currentUser.getIdToken() : null;
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    async upload(path, file){
      const encodedPath = encodeURIComponent(path);
      const url = `https://firebasestorage.googleapis.com/v0/b/${this.bucket}/o?uploadType=media&name=${encodedPath}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...(await this.headers()), 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Upload failed (${response.status})`);
      }
      await response.json();
      return `https://firebasestorage.googleapis.com/v0/b/${this.bucket}/o/${encodedPath}?alt=media`;
    }
  }
  window.RestStorage = RestStorage;
})();
