# Patch Bundle (Contact + Stripe + ColorSelector)
Copy these files into your project, overwriting if prompted.

- pages/_app.js                   # Navbar: Home, Shop, Commissions, Contact
- pages/contact.js                # Contact form with dropdown (set your email)
- components/ColorSelector.js     # Reusable color dropdown + chart image
- pages/api/checkout.js           # Stripe Checkout API route (passes selectedColor)
- pages/success.js                # Stripe success landing page
- pages/cancel.js                 # Stripe cancel page

## Setup
1) In Vercel → Project → Settings → Environment Variables:
   STRIPE_SECRET_KEY=sk_test_xxx

2) Locally create `.env.local` (do NOT commit):
   STRIPE_SECRET_KEY=sk_test_xxx

3) Put the color chart image at:
   public/images/necklace-color-chart.jpg

4) In product pages, wire the Stripe button to POST selectedColor to /api/checkout.
