const SUPABASE_URL = 'https://gmgcscfnfnqylccsjkrz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_utS1fkmWSipevwSpQX_uEA_m3Bvy88_';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = s => document.querySelector(s);
const hoje = () => new Date().toLocaleDateString('sv');
const dias = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5);
const planta = id => PLANTAS.find(p => p.id === id);

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

function aviso(t) {
  const a = $('#aviso');
  a.textContent = t;
  a.hidden = false;
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => { a.hidden = true; }, 3000);
}

const TITULOS = { feed: 'Plant+ | Início', detalhe: 'Plant+ | Foto', postar: 'Plant+ | Postar foto', plantas: 'Plant+ | Cultivos', guia: 'Plant+ | Guia da horta' };

function ir(nome) {
  document.querySelectorAll('.tela').forEach(t => t.classList.toggle('ativa', t.id === nome));
  document.querySelectorAll('#menu [data-ir]').forEach(b => b.classList.toggle('ativo', b.dataset.ir === (nome === 'detalhe' ? 'feed' : nome)));
  $('#titulo-tela').textContent = TITULOS[nome] || '';
  $('#topo-app').hidden = nome === 'login';
  $('#gaveta').hidden = true;
  window.scrollTo(0, 0);
}

let usuario = null, usuarioId = null, posts = [], minhas = [], atual, filtro = 'Tudo', estacao;
let cadastro = false;

function modo(c) {
  cadastro = c;
  $('#campo-nome').hidden = !c;
  $('#nome').required = c;
  $('#entrar').textContent = c ? 'Criar conta' : 'Entrar';
  $('#alternar').textContent = c ? 'Já tenho conta' : 'Criar conta';
  $('#senha').autocomplete = c ? 'new-password' : 'current-password';
  $('#erro-login').textContent = '';
}
$('#alternar').onclick = () => modo(!cadastro);

// Autenticação com Supabase
$('#form-login').onsubmit = async e => {
  e.preventDefault();
  const erro = $('#erro-login');
  const email = $('#email').value.trim();
  const senha = $('#senha').value;
  erro.textContent = '';

  if (cadastro) {
    const nome = $('#nome').value.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    });
    if (error) return (erro.textContent = error.message);
    aviso('Conta criada! Faça login.');
    modo(false);
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return (erro.textContent = 'E-mail ou senha incorretos.');
    iniciarSessao(data.session);
  }
};

async function iniciarSessao(session) {
  if (!session) return;
  usuarioId = session.user.id;
  usuario = session.user.user_metadata?.nome || session.user.email.split('@')[0];
  $('#gaveta-nome').textContent = usuario;
  
  $('#menu').hidden = false;
  estacao = estacaoAtual();
  
  await carregarPosts();
  await carregarMinhasPlantas();

  renderFiltros();
  renderFeed();
  renderPlantas();
  renderGuia();
  ir('feed');
}

$('#sair').onclick = async () => {
  await supabase.auth.signOut();
  usuario = null;
  usuarioId = null;
  $('#form-login').reset();
  modo(false);
  $('#menu').hidden = true;
  ir('login');
};

document.querySelectorAll('[data-ir]').forEach(b => {
  b.onclick = () => {
    if (b.dataset.ir === 'feed') renderFeed();
    ir(b.dataset.ir);
  };
});

function midia(p) {
  if (p.img?.startsWith('data:image/jpeg') || p.img?.startsWith('http')) {
    const i = el('img');
    i.src = p.img;
    i.alt = p.planta || 'Planta';
    return i;
  }
  const d = el('div', 'emoji', p.emoji || '🌱');
  d.style.background = p.cor || '#dcedc8';
  d.style.height = (p.alt || 240) + 'px';
  return d;
}

function renderFiltros() {
  const box = $('#filtros');
  box.replaceChildren();
  ['Tudo', ...new Set(PLANTAS.map(p => p.tipo))].forEach(t => {
    const b = el('button', 'chip' + (t === filtro ? ' on' : ''), t);
    b.onclick = () => { filtro = t; renderFiltros(); renderFeed(); };
    box.append(b);
  });
}

async function carregarPosts() {
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
  if (error || !data || data.length === 0) {
    posts = POSTS_INICIAIS.map((p, index) => ({ ...p, id: index + 1, curtidas: 0, curtiu: false, comentarios: [] }));
  } else {
    posts = data;
  }
}

async function curtir(p) {
  p.curtiu = !p.curtiu;
  p.curtidas += p.curtiu ? 1 : -1;
  await supabase.from('posts').upsert({ id: p.id, autor: p.autor, planta_id: p.plantaId, planta: p.planta, texto: p.texto, img: p.img, cor: p.cor, curtidas: p.curtidas, comentarios: p.comentarios });
}

function renderFeed() {
  const q = $('#busca').value.trim().toLowerCase();
  const g = $('#grade');
  g.replaceChildren();
  const lista = posts.filter(p => (filtro === 'Tudo' || planta(p.plantaId)?.tipo === filtro) && `${p.planta || ''} ${p.texto || ''} ${p.autor || ''}`.toLowerCase().includes(q));
  if (!lista.length) g.append(el('p', 'sub', 'Nenhuma foto encontrada.'));
  lista.forEach(p => {
    const c = el('article', 'card');
    const m = el('button', 'midia');
    m.setAttribute('aria-label', 'Abrir ' + (p.planta || 'planta'));
    m.append(midia(p));
    m.onclick = () => abrir(p.id);
    const info = el('div', 'info');
    const t = el('div');
    t.append(el('strong', null, p.planta), el('small', null, p.autor));
    const l = el('button', 'curtir', (p.curtiu ? '❤️ ' : '🤍 ') + p.curtidas);
    l.onclick = () => { curtir(p); renderFeed(); };
    info.append(t, l);
    c.append(m, info);
    g.append(c);
  });
}

$('#busca').oninput = renderFeed;

function abrir(id) {
  atual = posts.find(p => p.id === id);
  renderDetalhe();
  ir('detalhe');
}

function renderDetalhe() {
  const p = atual, pl = planta(p.plantaId);
  $('#det-midia').replaceChildren(midia(p));
  $('#det-titulo').textContent = p.planta;
  $('#det-autor').textContent = 'por ' + p.autor;
  $('#det-texto').textContent = p.texto;
  $('#det-curtir').textContent = (p.curtiu ? '❤️ ' : '🤍 ') + p.curtidas;
  const c = $('#det-cuidado');
  c.replaceChildren();
  if (pl) {
    c.append(el('strong', null, 'Como cuidar'));
    [`Luz: ${pl.luz}`, `Regar a cada ${pl.rega} dias`, `Onde plantar: ${pl.vaso}`, `Estações: ${pl.est.join(', ')}`, pl.dica].forEach(t => c.append(el('p', null, t)));
  }
  const lista = $('#lista-com');
  lista.replaceChildren();
  const coms = p.comentarios || [];
  if (!coms.length) lista.append(el('li', 'sub', 'Seja o primeiro a comentar.'));
  coms.forEach(x => {
    const li = el('li');
    li.append(el('strong', null, x.autor + ': '), document.createTextNode(x.texto));
    lista.append(li);
  });
}

$('#voltar').onclick = () => { renderFeed(); ir('feed'); };
$('#det-curtir').onclick = () => { curtir(atual); renderDetalhe(); };

$('#form-com').onsubmit = async e => {
  e.preventDefault();
  const t = $('#comentario').value.trim().slice(0, 200);
  if (!t) return;
  if (!atual.comentarios) atual.comentarios = [];
  atual.comentarios.push({ autor: usuario, texto: t });
  await supabase.from('posts').upsert({ id: atual.id, autor: atual.autor, planta_id: atual.plantaId, planta: atual.planta, texto: atual.texto, img: atual.img, cor: atual.cor, curtidas: atual.curtidas, comentarios: atual.comentarios });
  $('#comentario').value = '';
  renderDetalhe();
};

$('#post-planta').replaceChildren(...PLANTAS.map(p => Object.assign(el('option', null, p.nome), { value: p.id })));
$('#add-planta').replaceChildren(...PLANTAS.map(p => Object.assign(el('option', null, p.nome), { value: p.id })));

$('#form-post').onsubmit = async e => {
  e.preventDefault();
  const f = $('#foto').files[0];
  if (!f || !/^image\/(jpeg|png|webp)$/.test(f.type)) return aviso('Escolha uma foto JPG, PNG ou WebP.');
  try {
    const bmp = await createImageBitmap(f);
    const r = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * r);
    c.height = Math.round(bmp.height * r);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const pl = planta($('#post-planta').value);
    
    const novoPost = {
      autor: usuario,
      planta_id: pl.id,
      planta: pl.nome,
      texto: $('#post-texto').value.trim().slice(0, 200),
      img: c.toDataURL('image/jpeg', 0.8),
      curtidas: 0,
      comentarios: []
    };

    const { data, error } = await supabase.from('posts').insert([novoPost]).select();
    if (!error && data) posts.unshift(data[0]);

    e.target.reset();
    filtro = 'Tudo';
    renderFiltros();
    renderFeed();
    ir('feed');
    aviso('Foto publicada.');
  } catch {
    aviso('Não foi possível ler essa foto.');
  }
};

const ESTAGIOS = { semente: '🌱 Semente', muda: '🌿 Muda', adulta: '🪴 Adulta', frutificando: '🍅 Frutificando' };
const restam = m => planta(m.id || m.planta_sistema_id)?.rega - dias(hoje(), m.ultima || m.ultima_rega);

async function carregarMinhasPlantas() {
  const { data, error } = await supabase.from('meu_jardim').select('*').eq('utilizador_id', usuarioId);
  if (!error) {
    minhas = data || [];
  }
}

async function salvarMinhaPlanta(m) {
  await supabase.from('meu_jardim').upsert({
    id: m.id,
    utilizador_id: usuarioId,
    planta_sistema_id: m.planta_sistema_id || m.id,
    apelido: m.apelido || planta(m.id)?.nome,
    ultima_rega: m.ultima || m.ultima_rega || hoje(),
    data_plantio: m.data || m.data_plantio || hoje(),
    estagio: m.estagio || 'semente'
  });
}

function renderPlantas() {
  const pend = minhas.filter(m => restam(m) <= 0);
  $('#banner').textContent = pend.length ? `Rega pendente: ${pend.length} planta(s).` : 'Nenhuma rega pendente hoje.';
  $('#banner').classList.toggle('alerta', pend.length > 0);
  document.querySelector('[data-ir=plantas]').dataset.n = pend.length || '';
  const l = $('#lista-plantas');
  l.replaceChildren();
  if (!minhas.length) l.append(el('li', 'sub', 'Adicione as plantas que você cultiva.'));
  minhas.forEach((m, i) => {
    const plantaId = m.planta_sistema_id || m.id;
    const pl = planta(plantaId);
    if (!pl) return;
    const r = restam(m);
    const li = el('li', 'cultivo');
    const t = el('div', 'dados');
    t.append(el('strong', 'nome', `${pl.emoji} ${pl.nome}`));
    
    const dataPlantio = m.data_plantio || m.data;
    if (dataPlantio) {
      const n = dias(hoje(), dataPlantio);
      t.append(el('span', null, 'Data de plantio:'), el('b', null, dataPlantio.split('-').reverse().join('/')), el('small', null, n <= 0 ? 'Plantado hoje' : `Plantado há ${n} dia(s)`));
    }
    t.append(el('small', r <= 0 ? 'regar' : null, r <= 0 ? 'Regar hoje' : `Próxima rega em ${r} dia(s)`));
    if (m.estagio in ESTAGIOS) t.append(el('span', 'tag ' + m.estagio, ESTAGIOS[m.estagio]));
    
    const lado = el('div', 'lado');
    const ok = el('button', 'btn pequeno', 'Reguei');
    ok.onclick = async () => { 
      m.ultima = hoje(); 
      m.ultima_rega = hoje();
      await salvarMinhaPlanta(m); 
      renderPlantas(); 
    };
    const rm = el('button', 'lixo', '🗑️');
    rm.onclick = async () => { 
      if (m.id) await supabase.from('meu_jardim').delete().eq('id', m.id);
      minhas.splice(i, 1); 
      renderPlantas(); 
    };
    lado.append(ok, rm);
    li.append(t, lado);
    l.append(li);
  });
}

const modal = $('#modal');
const fecharModal = () => { modal.hidden = true; };
$('#fab').onclick = () => { $('#add-data').value = hoje(); modal.hidden = false; };
$('#cancelar').onclick = fecharModal;
modal.onclick = e => { if (e.target === modal) fecharModal(); };
$('#hamb').onclick = () => { $('#gaveta').hidden = !$('#gaveta').hidden; };

$('#form-add').onsubmit = async e => {
  e.preventDefault();
  const plantaId = $('#add-planta').value;
  if (minhas.some(m => (m.planta_sistema_id || m.id) === plantaId)) return aviso('Você já adicionou essa planta.');
  
  const novaPlanta = {
    utilizador_id: usuarioId,
    planta_sistema_id: plantaId,
    apelido: planta(plantaId)?.nome,
    ultima_rega: hoje(),
    data_plantio: $('#add-data').value || hoje(),
    estagio: document.querySelector('[name=estagio]:checked').value
  };

  const { data, error } = await supabase.from('meu_jardim').insert([novaPlanta]).select();
  if (!error && data) {
    minhas.push(data[0]);
    renderPlantas();
    fecharModal();
    aviso('Planta adicionada ao jardim!');
  } else {
    aviso('Erro ao salvar planta.');
  }
};

function estacaoAtual() {
  const m = new Date().getMonth();
  return m === 11 || m < 2 ? 'verão' : m < 5 ? 'outono' : m < 8 ? 'inverno' : 'primavera';
}

function renderGuia() {
  const box = $('#estacoes');
  box.replaceChildren();
  TODAS.forEach(s => {
    const b = el('button', 'chip' + (s === estacao ? ' on' : ''), s);
    b.onclick = () => { estacao = s; renderGuia(); };
    box.append(b);
  });
  const l = $('#guia-lista');
  l.replaceChildren();
  PLANTAS.filter(p => p.est.includes(estacao)).forEach(p => {
    const li = el('li', 'item');
    const t = el('div');
    t.append(el('strong', null, `${p.emoji} ${p.nome}`), el('small', null, `${p.luz} · regar a cada ${p.rega} dias`), el('small', null, p.dica));
    li.append(t);
    l.append(li);
  });
  $('#dicas').replaceChildren(...DICAS.map(d => el('li', null, d)));
}

// Checa sessão ao carregar a página
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) iniciarSessao(session);
});