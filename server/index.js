const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Confirm payment endpoint
app.post('/api/paystack/confirm', async (req, res) => {
  const { reference, userId } = req.body;
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    if (response.data.data.status === 'success') {
      // Update user in Supabase
      const { error } = await supabase
        .from('users')
        .update({ isPaidUser: true })
        .eq('id', userId);
      if (error) {
        return res.json({ success: false, error: error.message });
      }
      return res.json({ success: true });
    } else {
      return res.json({ success: false, error: 'Payment not successful' });
    }
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
});

// Webhook endpoint (optional, for Paystack events)
app.post('/api/paystack/webhook', async (req, res) => {
  // Validate event and update user payment status in Supabase if needed
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on port 3000'));
