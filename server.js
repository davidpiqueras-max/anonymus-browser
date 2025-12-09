// server.js
import express from 'express';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import helmet from 'helmet';


const app = express();
app.use(helmet());
app.use(express.static('public'));


// CONFIG
const TOR_SOCKS = process.env.TOR_SOCKS || 'socks5h://127.0.0.1:9050';
const SEARCH_BACKEND = process.env.SEARCH_BACKEND || 'https://searx.example.org/search';
// Nota: reemplaza searx.example.org por una instancia pública o tu propia instancia Searx.


// Crea agente SOCKS para Tor
const agent = new SocksProxyAgent(TOR_SOCKS);


function sanitizeHeaders(req) {
const headers = {};
// No forward headers that leak info
// Opcional: añadir cabeceras mínimas necesarias
headers['User-Agent'] = 'private-search-proxy/1.0';
headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
return headers;
}


app.get('/search', async (req, res) => {
try {
const q = req.query.q || '';
if (!q) return res.status(400).send('q is required');


// Construye URL al backend (ejemplo para Searx con 'q' param y formato HTML)
const url = new URL(SEARCH_BACKEND);
url.searchParams.set('q', q);
// Dependiendo del backend, ajustar parámetros (e.g. format, engines...)


const headers = sanitizeHeaders(req);


// No logging of queries anywhere
const r = await fetch(url.toString(), { headers, agent, redirect: 'follow' });
const text = await r.text();


// Passthrough: devolver HTML crudo. Podrías filtrar o reescribir enlaces si quieres.
res.set('Content-Type', 'text/html; charset=utf-8');
res.send(text);
} catch (err) {
console.error('Error (no logs of queries):', err?.message || err);
res.status(502).send('backend error');
}
});


// Minimal healthcheck
app.get('/health', (req, res) => res.send('ok'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Private search proxy running on ${PORT}`));
