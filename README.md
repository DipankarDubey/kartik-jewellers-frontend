# Karthik Jewellers — React storefront and admin dashboard

A premium burgundy/gold React + Vite website based on the Karthik Jewellers UI/UX concept PDF. Includes public home, filterable catalogue, contact, maps directions, and private admin login, dashboard, product editor, visitor register and email campaign UI.

## Start locally

1. Run the sibling `kartik-jewellers-backend` API first with its own `.env` and MongoDB Atlas setup.
2. `cp .env.example .env` and set `VITE_API_URL=http://localhost:5000/api`.
3. `npm install` then `npm run dev`.
4. Open `http://localhost:5173`. Admin is at `/admin/login`.
5. For a production build, run `npm run build` and host `dist/` on any static host supporting SPA fallback to `index.html`.

Brand imagery is adapted from the original generated Karthik Jewellers design sample. The product photographs are **placeholder concept crops**, not actual jewellery stock photographs. Replace them using the admin editor and Cloudinary uploads. The name on the image-based logo is generated art; the site navigation uses a crisp text/monogram version for accessibility at small sizes.

Change the store address, Google Maps URL, phone, and email in the backend environment. No customer checkout / payment gateway is included. The backend is required for catalogue data and all admin features.


## Gold / Silver customer site and navy-gold admin

- The customer homepage shows Gold and Silver selectors. Theme choice persists in localStorage and applies across public pages.
- Admin > Products: choose Gold or Silver for each jewellery item. Legacy products without a metal field appear under Gold until edited.
- Admin > Shop settings: edit address, Google Maps link, phone, email, official logo, and favicon. Upload the supplied original PNG plus a square K/diamond image using these controls and save. These override the fallback repo branding.
- Admin > Email: attach an offer poster to consent-only campaigns. Admin > WhatsApp: use click-to-chat or configured Meta-approved image-header template sending.
- Cloudinary delivery uses high-quality max-1000px images. Existing 480x350 sample photos cannot be made sharp just by URL transformations; upload genuine 1200px+ originals.
- Deployment: merge/deploy backend before frontend. Never commit credentials.
