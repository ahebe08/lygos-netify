const axios = require('axios');

exports.handler = async (event) => {
  // Autoriser CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Gérer les requêtes OPTIONS pour CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { amount, product_name, order_id } = JSON.parse(event.body);

    console.log('🔄 Creating Lygos payment gateway...', {
      amount,
      product_name,
      order_id
    });

    // Validation
    if (!amount || !product_name || !order_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Données manquantes'
        })
      };
    }

    // Configuration Lygos
    const LYGOUS_API_URL = 'https://api.lygosapp.com/v1/gateway';
    const LYGOUS_API_KEY = process.env.LYGOS_API_KEY;

    const lygosPayload = {
      amount: amount,
      shop_name: "Boutique ATS",
      message: `Paiement pour: ${product_name}`,
      success_url: `${process.env.URL}/.netlify/functions/payment-success?order_id=${order_id}`,
      failure_url: `${process.env.URL}/.netlify/functions/payment-failed?order_id=${order_id}`,
      order_id: order_id
    };

    const response = await axios.post(LYGOUS_API_URL, lygosPayload, {
      headers: {
        'api-key': LYGOUS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const { id: gateway_id, link: checkout_url } = response.data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        checkout_url,
        gateway_id,
        order_id
      })
    };

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erreur création paiement',
        details: error.response?.data || error.message
      })
    };
  }
};