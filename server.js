const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration Lygos
const LYGOUS_API_URL = 'https://api.lygosapp.com/v1/gateway';
const LYGOUS_API_KEY = process.env.LYGOS_API_KEY;

// Stockage temporaire des transactions (en production, utilisez une base de données)
const transactions = new Map();

// Endpoint pour créer une passerelle de paiement
app.post('/api/create-gateway', async (req, res) => {
  try {
    const { amount, product_name, order_id } = req.body;

    console.log('🔄 Creating Lygos payment gateway...', {
      amount,
      product_name,
      order_id
    });

    // Validation des données
    if (!amount || !product_name || !order_id) {
      return res.status(400).json({
        success: false,
        error: 'Données manquantes: amount, product_name et order_id sont requis'
      });
    }

    // Préparer les données pour l'API Lygos
    const lygosPayload = {
      amount: amount,
      shop_name: "Boutique ATS",
      message: `Paiement pour: ${product_name}`,
      success_url: `${process.env.BACKEND_URL}/api/payment-success?order_id=${order_id}`,
      failure_url: `${process.env.BACKEND_URL}/api/payment-failed?order_id=${order_id}`,
      order_id: order_id
    };

    console.log('📤 Sending to Lygos API:', lygosPayload);

    // Appel à l'API Lygos
    const response = await axios.post(LYGOUS_API_URL, lygosPayload, {
      headers: {
        'api-key': LYGOUS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Lygos API response:', response.data);

    const { id: gateway_id, link: checkout_url } = response.data;

    // Stocker la transaction
    transactions.set(order_id, {
      gateway_id,
      amount,
      product_name,
      order_id,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      checkout_url,
      gateway_id,
      order_id
    });

  } catch (error) {
    console.error('❌ Error creating payment gateway:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du paiement',
      details: error.response?.data || error.message
    });
  }
});

// Webhook pour recevoir les notifications de paiement Lygos
app.post('/api/webhook', async (req, res) => {
  try {
    const { order_id, status, gateway_id } = req.body;

    console.log('📨 Webhook received:', { order_id, status, gateway_id });

    // Mettre à jour le statut de la transaction
    if (transactions.has(order_id)) {
      const transaction = transactions.get(order_id);
      transaction.status = status;
      transaction.updated_at = new Date().toISOString();
      
      console.log(`✅ Transaction ${order_id} updated to status: ${status}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Endpoint pour vérifier le statut d'un paiement
app.get('/api/payment-status/:gatewayId', async (req, res) => {
  try {
    const { gatewayId } = req.params;

    console.log('🔍 Checking payment status for:', gatewayId);

    // En production, vous devriez interroger l'API Lygos ou votre base de données
    // Pour l'exemple, nous cherchons dans notre Map temporaire
    let transaction = null;
    for (let [orderId, tx] of transactions) {
      if (tx.gateway_id === gatewayId) {
        transaction = tx;
        break;
      }
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction non trouvée'
      });
    }

    res.json({
      success: true,
      status: transaction.status,
      order_id: transaction.order_id,
      amount: transaction.amount,
      product_name: transaction.product_name
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du statut'
    });
  }
});

// Pages de redirection après paiement
app.get('/api/payment-success', (req, res) => {
  const { order_id } = req.query;
  console.log('✅ Payment successful for order:', order_id);
  
  // Mettre à jour le statut
  if (order_id && transactions.has(order_id)) {
    transactions.get(order_id).status = 'success';
  }

  // Rediriger vers l'application Flutter
  res.send(`
    <html>
      <head>
        <title>Paiement Réussi</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: green; }
        </style>
      </head>
      <body>
        <h1 class="success">✅ Paiement Réussi!</h1>
        <p>Votre paiement a été traité avec succès.</p>
        <p>Vous pouvez retourner à l'application.</p>
        <script>
          // Fermer la fenêtre après 3 secondes
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
    </html>
  `);
});

app.get('/api/payment-failed', (req, res) => {
  const { order_id } = req.query;
  console.log('❌ Payment failed for order:', order_id);
  
  // Mettre à jour le statut
  if (order_id && transactions.has(order_id)) {
    transactions.get(order_id).status = 'failed';
  }

  res.send(`
    <html>
      <head>
        <title>Paiement Échoué</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: red; }
        </style>
      </head>
      <body>
        <h1 class="error">❌ Paiement Échoué</h1>
        <p>Une erreur est survenue lors du traitement de votre paiement.</p>
        <p>Veuillez réessayer.</p>
        <script>
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
    </html>
  `);
});

// Endpoint de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    transactions_count: transactions.size
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});