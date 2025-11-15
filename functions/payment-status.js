exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const { gatewayId } = event.pathParameters;

    // En production, utiliser une base de données
    // Pour la démo, retourner un statut simulé
    const status = Math.random() > 0.5 ? 'success' : 'pending';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: status,
        gateway_id: gatewayId
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erreur vérification statut'
      })
    };
  }
};