// Validează că header-ul X-Client-Id este prezent și are forma unui UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function verificaClientId(req, res, next) {
  const clientId = req.headers['x-client-id'];
  if (!clientId || !UUID_REGEX.test(clientId)) {
    return res.status(400).json({ eroare: 'Header X-Client-Id lipsă sau invalid (trebuie să fie UUID v4).' });
  }
  req.clientId = clientId;
  next();
}
