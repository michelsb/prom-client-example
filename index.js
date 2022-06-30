const express = require('express');
const prometheus = require('prom-client');

const collectDefaultMetrics = prometheus.collectDefaultMetrics;
const register = prometheus.register;
collectDefaultMetrics({ register });

const app = express();

const request_total_counter = new prometheus.Counter({
  name: 'app_request_total',
  help: 'Contador de Requisições',
  labelNames: ['method', 'statusCode'],
});

const request_time_gauge = new prometheus.Gauge({
  name: 'app_request_time',
  help: 'Último Tempo de Resposta Registrado em Milisegundos',
  labelNames: ['method', 'statusCode'],
});

const request_time_histogram = new prometheus.Histogram({
  name: 'app_hist_request_time',
  help: 'Histograma do Tempo de Resposta das Requisições em Milisegundos',
});

const request_time_summary = new prometheus.Summary({
  name: 'app_summ_request_time',
  help: 'Resumo do Tempo de Resposta das Requisições em Milisegundos',
  percentiles: [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999],
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get('/', async function (req, res) {
  const success = req.query.success == null || req.query.success === 'true';
  const statusCode = success ? 200 : 500;
  request_total_counter.labels({ method: 'GET', statusCode: statusCode }).inc(); // Incrementando em 1 um contador da quantidade de requisições desta rota na aplicação
  const initialTime = Date.now();
  await sleep(100 * Math.random());
  const durationTime = Date.now() - initialTime;
  request_time_gauge.labels({ method: 'GET', statusCode: statusCode }).set(durationTime);
  request_time_histogram.observe(durationTime); // Adicionando o tempo de resposta da requisição para visualização do histograma
  request_time_summary.observe(durationTime); // Adicionando o tempo de resposta da requisição para visualização dos percentis

  res.status(statusCode).json({ success: success, data: { message: `Requisição realizada em ${durationTime} ms.` } });
});

app.get('/metrics', async function (req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(5000);
