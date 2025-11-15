exports.handler = async (event) => {
  const { order_id } = event.queryStringParameters;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Paiement Échoué</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
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
          <h1>❌ Paiement Échoué</h1>
          <p>Erreur avec la commande #${order_id}.</p>
          <p>Veuillez réessayer.</p>
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