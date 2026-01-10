// API endpoint to handle form submissions
// This sends you an email notification when someone submits a form

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // For now, we'll just log it. 
  // In production, you could:
  // 1. Store in a database
  // 2. Add to Mailchimp/Buttondown
  // 3. Send yourself an email notification
  
  console.log('New mailing list signup:', email);

  // You could add email notification here using a service like:
  // - Resend (free tier available)
  // - SendGrid
  // - Or just use the Vercel serverless function to write to a file/database

  // For a simple solution, we'll return success and you can check Vercel logs
  // Or implement a simple email notification

  return res.status(200).json({ 
    success: true, 
    message: 'Thanks for subscribing!' 
  });
}
