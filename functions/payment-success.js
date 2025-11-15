exports.handler = async (event) => {
  const { order_id } = event.queryStringParameters;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Paiement Réussi</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Paiement Réussi!</h1>
          <p>Votre commande #${order_id} a été confirmée.</p>
          <p>Vous pouvez fermer cette fenêtre.</p>
        </div>
        <script>
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
    </html>
  `;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html
  };
};