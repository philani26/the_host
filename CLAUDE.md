# Images

Never add or edit content images by placing files in the local `images/` folder and referencing them by path (e.g. `images/12.jpeg`). That folder is legacy/unmanaged and caused a real bug: static paths get cached by browsers and Firebase's CDN, so replacing a file at the same path left stale images showing for visitors until the cache expired.

All content images (hero images, About/Experiences/gallery photos, testimonials, trip photos, the admin media library) must be uploaded through the admin panel's "Upload Image" / "Choose From Library" flow. That writes to Firebase Storage under `uploads/...` with a unique per-upload filename and `Cache-Control: private, max-age=0` — a new image is always a new URL, so there's nothing to go stale.

The only files that stay in the local `images/` folder are brand chrome: `logo-mark.jpg` (favicon/nav logo) and `logo.jpeg`. Everything else has already been migrated to Storage — if you find a new hardcoded `images/N.jpeg`-style reference in the code, that's a regression, not an existing pattern to follow.
