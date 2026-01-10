// API endpoint to handle commission request form submissions

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;

  // Log the commission request (check Vercel logs)
  console.log('New commission request:', JSON.stringify(data, null, 2));

  // In production, you could send yourself an email notification
  // For now, this logs to Vercel and returns success
  // The form will fall back to mailto: if this fails

  return res.status(200).json({ 
    success: true, 
    message: 'Commission request received!' 
  });
}
