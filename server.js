const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();

class Ticket {
  constructor(id, name, status, created) {
    this.id = id // идентификатор (уникальный в пределах системы)
    this.name = name // краткое описание
    this.status = status // boolean - сделано или нет
    this.created = created // дата создания (timestamp)
  }
}

class TicketFull {
  constructor(id, name, description, status, created) {
    this.id = id // идентификатор (уникальный в пределах системы)
    this.name = name // краткое описание
    this.description = description // полное описание
    this.status = status // boolean - сделано или нет
    this.created = created // дата создания (timestamp)
  }
}

let ticketsFull = [
  new TicketFull(0, 'Install Win', 'Install Windows 10, drivers for printer, MS Office, save documents and mediafiles', false, new Date().toString().slice(3,21)),
  new TicketFull(1, 'Replace cartridge', 'Replace cartridge for printer Samsung in cabinet #404', true, new Date().toString().slice(3,21))
];

// CORS
app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  
  const headers = { 'Access-Control-Allow-Origin': '*', };
  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers};
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
    ctx.response.status = 204;
  }
});

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

function tickets() {
  const arr = [];
  ticketsFull.forEach((elem) => {
    arr.push(new Ticket(elem.id, elem.name, elem.status, elem.created));
  });
  return arr;
}

function findTicket(id) {
  const result = ticketsFull.find((ticket) => ticket.id === id);
  return result;
}

app.use(async ctx => {
  const params = new URLSearchParams(ctx.request.querystring);
  const obj = { method: params.get('method'), id: params.get('id') };
  const { method, id } = obj;
  const { body } = ctx.request;

  console.log('method:', method, 'id:', id, 'ctx', body);
  switch (method) {
    case 'allTickets':
      ctx.response.body = tickets();
      return;
    case 'ticketById':
      if (ctx.request.query.id) {
        ctx.response.body = findTicket(+id);
      }
      return;
    case 'createTicket':
      const nextId = ticketsFull.length;
      ticketsFull.push(new TicketFull(nextId, body.title, body.description, false, new Date().toString().slice(3,21)));
      ctx.response.body = ticketsFull[nextId];
      console.log(ticketsFull.length);
      return;
    case 'editTicket':
      const index = body.id;
      ticketsFull[index].name = body.title;
      ticketsFull[index].description = body.description;
      ctx.response.body = ticketsFull[index];
      return;
    case 'deleteTicket':
      const ind = ticketsFull.findIndex((ticket) => +ticket.id === +id);
      console.log('index', ind);
      ctx.response.body = 'del';
      ticketsFull.splice(ind, 1);
      return;
    default:
      ctx.response.status = 404;
      return;
  }
});

app.use(async (ctx) => {
  console.log('request.querystring:', ctx.request.querystring);
  console.log('request.body', ctx.request.body);
  ctx.response.status = 204;

  console.log(ctx.response);
});

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port);
