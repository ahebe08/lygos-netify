exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: 'Netlify Functions'
    })
  };
};