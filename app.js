const SUPABASE_URL = 'https://gmgcscfnfnqylccsjkrz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_utS1fkmWSipevwSpQX_uEA_m3Bvy88_';
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

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

const TITULOS = { feed: 'Plant+ | Minhas Fotos', detalhe: 'Plant+ | Foto', postar: 'Plant+ | Postar foto', plantas: 'Plant+ | Cultivos', guia: 'Plant+ | Guia da horta' };

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
let edicaoCultivoId = null;
let edicaoPostId = null;
const erroBanco = (operacao, error) => {
  console.error(`[Plant+] ${operacao}`, error);
  aviso(`Erro ao ${operacao}: ${error?.message || 'verifique o Console (F12)'}`);
};
const donoPost = p => !!usuarioId && p.usuario_id === usuarioId;


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

// Autenticação com Supabase usando 'db'
$('#form-login').onsubmit = async e => {
  e.preventDefault();
  const erro = $('#erro-login');
  const email = $('#email').value.trim();
  const senha = $('#senha').value;
  erro.textContent = '';

  if (cadastro) {
    const nome = $('#nome').value.trim();
    const { data, error } = await db.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    });
    if (error) return (erro.textContent = error.message);
    aviso('Conta criada! Faça login.');
    modo(false);
  } else {
    const { data, error } = await db.auth.signInWithPassword({ email, password: senha });
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
  await db.auth.signOut();
  usuario = null;
  usuarioId = null;
  posts = []; minhas = []; atual = null;
  $('#form-login').reset();
  modo(false);
  $('#menu').hidden = true;
  ir('login');
};

document.querySelectorAll('[data-ir]').forEach(b => {
  b.onclick = () => {
    if (b.dataset.ir === 'feed') renderFeed();
    if (b.dataset.ir === 'postar' && edicaoPostId !== null) resetarEdicaoPost();
    ir(b.dataset.ir);
  };
});

function midia(p) {
  if (p.img?.startsWith('data:image/') || p.img?.startsWith('https://')) {
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
  if (!db || !usuarioId) return;
  const { data, error } = await db.from('posts')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false });
  if (error) { posts = []; erroBanco('carregar suas fotos', error); return; }
  posts = data || [];
}

function renderFeed() {
  const q = $('#busca').value.trim().toLowerCase();
  const g = $('#grade');
  g.replaceChildren();
  const lista = posts.filter(p => (filtro === 'Tudo' || planta(p.planta_id)?.tipo === filtro) && `${p.planta || ''} ${p.texto || ''} ${p.autor || ''}`.toLowerCase().includes(q));
  if (!lista.length) g.append(el('p', 'sub', 'Nenhuma foto encontrada. Adicione uma foto da sua planta!'));
  lista.forEach(p => {
    const c = el('article', 'card');
    const m = el('button', 'midia');
    m.setAttribute('aria-label', 'Abrir ' + (p.planta || 'planta'));
    m.append(midia(p));
    m.onclick = () => abrir(p.id);
    const info = el('div', 'info');
    const t = el('div');
    t.append(el('strong', null, p.planta), el('small', null, p.texto || ''));
    info.append(t);
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
  const p = atual;
  if (!p) { ir('feed'); return; }
  const pl = planta(p.planta_id);
  $('#det-midia').replaceChildren(midia(p));
  $('#det-titulo').textContent = p.planta || 'Minha planta';
  $('#det-texto').textContent = p.texto || '';
  $('#det-editar').hidden = !donoPost(p);
  $('#det-excluir').hidden = !donoPost(p);
  const cuidado = $('#det-cuidado');
  cuidado.replaceChildren();
  if (pl) {
    cuidado.append(el('strong', null, 'Como cuidar'));
    [`Luz: ${pl.luz}`, `Regar a cada ${pl.rega} dias`, `Onde plantar: ${pl.vaso}`, `Estações: ${pl.est.join(', ')}`, pl.dica]
      .forEach(t => cuidado.append(el('p', null, t)));
  }
}

$('#voltar').onclick = () => { renderFeed(); ir('feed'); };

$('#det-editar').onclick = () => {
  if (!atual || !donoPost(atual)) return;
  edicaoPostId = atual.id;
  $('#post-planta').value = atual.planta_id;
  $('#post-texto').value = atual.texto || '';
  $('#foto').required = false;
  $('#foto-ajuda').hidden = false;
  $('#post-titulo').textContent = 'Editar publicação';
  $('#post-salvar').textContent = 'Salvar alterações';
  $('#post-cancelar').hidden = false;
  ir('postar');
};

function resetarEdicaoPost() {
  edicaoPostId = null;
  $('#form-post').reset();
  $('#foto').required = true;
  $('#foto-ajuda').hidden = true;
  $('#post-titulo').textContent = 'Postar foto';
  $('#post-salvar').textContent = 'Publicar';
  $('#post-cancelar').hidden = true;
}
$('#post-cancelar').onclick = () => { resetarEdicaoPost(); renderFeed(); ir('feed'); };
$('#det-excluir').onclick = async () => {
  if (!atual || !donoPost(atual) || !confirm('Excluir esta publicação definitivamente?')) return;
  const id = atual.id;
  const { data, error } = await db.from('posts').delete()
    .eq('id', id).eq('usuario_id', usuarioId).select('id');
  if (error) return erroBanco('excluir publicação', error);
  if (!data?.length) return aviso('Publicação não encontrada ou sem permissão.');
  posts = posts.filter(p => p.id !== id);
  atual = null;
  renderFeed(); ir('feed'); aviso('Publicação excluída.');
};

$('#post-planta').replaceChildren(...PLANTAS.map(p => Object.assign(el('option', null, p.nome), { value: p.id })));
$('#add-planta').replaceChildren(...PLANTAS.map(p => Object.assign(el('option', null, p.nome), { value: p.id })));

async function fotoParaBase64(f) {
  if (!f || !/^image\/(jpeg|png|webp)$/.test(f.type)) throw new Error('Escolha uma foto JPG, PNG ou WebP.');
  if (f.size > 10 * 1024 * 1024) throw new Error('A foto deve ter até 10 MB.');
  const bmp = await createImageBitmap(f);
  try {
    const escala = Math.min(1, 800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * escala));
    c.height = Math.max(1, Math.round(bmp.height * escala));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.65);
  } finally { bmp.close?.(); }
}

$('#form-post').onsubmit = async e => {
  e.preventDefault();
  if (!db || !usuarioId) return aviso('Faça login para salvar fotos.');
  const pl = planta($('#post-planta').value);
  if (!pl) return aviso('Selecione uma planta válida.');
  const texto = $('#post-texto').value.trim().slice(0, 200);
  if (!texto) return aviso('Escreva uma legenda.');
  const botao = $('#post-salvar');
  botao.disabled = true;
  try {
    const foto = $('#foto').files[0];
    const campos = { planta_id: pl.id, planta: pl.nome, texto };
    if (foto) campos.img = await fotoParaBase64(foto);
    if (edicaoPostId !== null) {
      const { data, error } = await db.from('posts')
        .update(campos).eq('id', edicaoPostId).eq('usuario_id', usuarioId)
        .select().single();
      if (error) throw error;
      const anterior = posts.find(p => p.id === data.id);
      if (anterior) Object.assign(anterior, data);
      atual = anterior || data;
      resetarEdicaoPost(); renderFeed(); renderDetalhe(); ir('detalhe');
      aviso('Foto atualizada!');
    } else {
      if (!foto) throw new Error('Escolha uma foto para publicar.');
      const { data, error } = await db.from('posts')
        .insert({ ...campos, usuario_id: usuarioId, autor: usuario })
        .select().single();
      if (error) throw error;
      posts.unshift(data);
      resetarEdicaoPost(); filtro = 'Tudo'; renderFiltros(); renderFeed(); ir('feed');
      aviso('Foto salva na sua galeria!');
    }
  } catch (error) { erroBanco('salvar foto', error); }
  finally { botao.disabled = false; }
};

const ESTAGIOS = { semente: '🌱 Semente', muda: '🌿 Muda', adulta: '🪴 Adulta', frutificando: '🍅 Frutificando' };
const restam = m => {
  const pl = planta(m.planta_sistema_id);
  if (!pl || !m.ultima_rega) return Infinity;
  return pl.rega - dias(hoje(), m.ultima_rega);
};

function erroJardim(operacao, error) {
  console.error(`Supabase - ${operacao}:`, error);
  aviso(`Não foi possível ${operacao}. Consulte o Console (F12).`);
}

async function carregarMinhasPlantas() {
  if (!db || !usuarioId) return;
  try {
    const { data, error } = await db.from('meu_jardim')
      .select('*')
      .eq('utilizador_id', usuarioId)
      .order('criado_em', { ascending: false });
    if (error) throw error;
    minhas = data || [];
  } catch (error) {
    erroJardim('carregar o jardim', error);
  }
}

async function salvarMinhaPlanta(m) {
  if (!db || !usuarioId || !m.id) {
    aviso('Faça login para atualizar o cultivo.');
    return null;
  }
  try {
    const { data, error } = await db.from('meu_jardim')
      .update({
        planta_sistema_id: m.planta_sistema_id,
        apelido: m.apelido,
        ultima_rega: m.ultima_rega,
        data_plantio: m.data_plantio,
        estagio: m.estagio
      })
      .eq('id', m.id)
      .eq('utilizador_id', usuarioId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    erroJardim('atualizar o cultivo', error);
    return null;
  }
}

function renderPlantas() {
  const pend = minhas.filter(m => restam(m) <= 0);
  $('#banner').textContent = pend.length ? `Rega pendente: ${pend.length} planta(s).` : 'Nenhuma rega pendente hoje.';
  $('#banner').classList.toggle('alerta', pend.length > 0);
  document.querySelector('[data-ir=plantas]').dataset.n = pend.length || '';
  const lista = $('#lista-plantas');
  lista.replaceChildren();
  if (!minhas.length) lista.append(el('li', 'sub', 'Adicione as plantas que você cultiva.'));
  minhas.forEach(m => {
    const pl = planta(m.planta_sistema_id);
    const li = el('li', 'cultivo');
    const t = el('div', 'dados');
    t.append(el('strong', 'nome', `${pl?.emoji || '🌱'} ${m.apelido || pl?.nome || m.planta_sistema_id}`));
    if (m.data_plantio) {
      const n = dias(hoje(), m.data_plantio);
      t.append(el('span', null, 'Data de plantio:'), el('b', null, m.data_plantio.split('-').reverse().join('/')),
        el('small', null, n <= 0 ? 'Plantado hoje' : `Plantado há ${n} dia(s)`));
    }
    const r = restam(m);
    t.append(el('small', r <= 0 ? 'regar' : null,
      !Number.isFinite(r) ? 'Rega não configurada' : r <= 0 ? 'Regar hoje' : `Próxima rega em ${r} dia(s)`));
    if (m.estagio in ESTAGIOS) t.append(el('span', 'tag ' + m.estagio, ESTAGIOS[m.estagio]));
    const lado = el('div', 'lado');
    const ok = el('button', 'btn pequeno', 'Reguei');
    ok.onclick = async () => {
      ok.disabled = true;
      const atualizado = await salvarMinhaPlanta({ ...m, ultima_rega: hoje() });
      if (atualizado) { Object.assign(m, atualizado); renderPlantas(); aviso('Rega registrada!'); }
      else ok.disabled = false;
    };
    const editar = el('button', 'btn claro pequeno', 'Editar');
    editar.onclick = () => abrirModalCultivo(m);
    const excluir = el('button', 'btn claro pequeno', 'Excluir');
    excluir.onclick = async () => {
      if (!confirm('Excluir este cultivo definitivamente?')) return;
      excluir.disabled = true;
      const { data, error } = await db.from('meu_jardim')
        .delete().eq('id', m.id).eq('utilizador_id', usuarioId).select('id');
      if (error) { erroBanco('excluir cultivo', error); excluir.disabled = false; return; }
      if (!data?.length) { aviso('Cultivo não encontrado ou sem permissão.'); excluir.disabled = false; return; }
      minhas = minhas.filter(item => item.id !== m.id);
      renderPlantas(); aviso('Cultivo excluído.');
    };
    lado.append(ok, editar, excluir);
    li.append(t, lado); lista.append(li);
  });
}

const modal = $('#modal');
function fecharModal() { modal.hidden = true; edicaoCultivoId = null; }
function abrirModalCultivo(m = null) {
  edicaoCultivoId = m?.id || null;
  $('#form-add').reset();
  $('#add-titulo').textContent = m ? 'Editar cultivo' : 'Seu cultivo';
  $('#add-salvar').textContent = m ? 'Salvar alterações' : 'Adicionar';
  $('#add-planta').value = m?.planta_sistema_id || PLANTAS[0].id;
  $('#add-data').value = m?.data_plantio || hoje();
  $('#add-apelido').value = m?.apelido || '';
  const estagio = m?.estagio || 'semente';
  const radio = [...document.querySelectorAll('[name=estagio]')].find(el => el.value === estagio);
  if (radio) radio.checked = true;
  modal.hidden = false;
}
$('#fab').onclick = () => abrirModalCultivo();
$('#cancelar').onclick = fecharModal;
modal.onclick = e => { if (e.target === modal) fecharModal(); };
$('#hamb').onclick = () => { $('#gaveta').hidden = !$('#gaveta').hidden; };

$('#form-add').onsubmit = async e => {
  e.preventDefault();
  if (!db || !usuarioId) return aviso('Faça login para salvar uma planta.');
  const plantaId = $('#add-planta').value;
  if (!planta(plantaId)) return aviso('Planta inválida.');
  const campos = {
    planta_sistema_id: plantaId,
    apelido: $('#add-apelido').value.trim().slice(0, 60) || planta(plantaId).nome,
    data_plantio: $('#add-data').value,
    estagio: document.querySelector('[name=estagio]:checked').value
  };
  const botao = $('#add-salvar');
  botao.disabled = true;
  try {
    if (edicaoCultivoId) {
      const atual = minhas.find(m => m.id === edicaoCultivoId);
      const resultado = await salvarMinhaPlanta({ ...atual, ...campos });
      if (!resultado) return;
      Object.assign(atual, resultado);
      fecharModal(); renderPlantas(); aviso('Cultivo atualizado!');
    } else {
      const { data, error } = await db.from('meu_jardim')
        .insert({ ...campos, utilizador_id: usuarioId, ultima_rega: hoje() })
        .select().single();
      if (error) throw error;
      minhas.push(data);
      fecharModal(); renderPlantas(); aviso('Planta adicionada ao jardim!');
    }
  } catch (error) {
    erroBanco('salvar cultivo', error);
  } finally {
    botao.disabled = false;
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

// Checa sessão ao carregar a página usando 'db'
if (db) {
  db.auth.getSession().then(({ data: { session } }) => {
    if (session) iniciarSessao(session);
  });
}
// PWA: apenas os arquivos estáticos são guardados no cache; dados pessoais continuam no Supabase.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service Worker:', error));
  });
}
