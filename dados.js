const TODAS = ['verão', 'outono', 'inverno', 'primavera'];

const PLANTAS = [
  { id: 'alface', nome: 'Alface', emoji: '🥬', tipo: 'Hortaliças', luz: 'Sol da manhã, 4 a 6 h', rega: 2, vaso: 'Vaso de 20 cm ou jardineira', est: ['outono', 'inverno', 'primavera'], dica: 'Colha as folhas externas e deixe o centro crescer. No calor forte, prefira meia-sombra.' },
  { id: 'couve', nome: 'Couve', emoji: '🥬', tipo: 'Hortaliças', luz: 'Sol pleno, 5 h ou mais', rega: 3, vaso: 'Vaso de 30 cm', est: ['outono', 'inverno', 'primavera'], dica: 'Retire as folhas de baixo para cima; a planta rebrota por meses.' },
  { id: 'rucula', nome: 'Rúcula', emoji: '🥗', tipo: 'Hortaliças', luz: 'Sol da manhã, 4 h', rega: 2, vaso: 'Jardineira', est: ['outono', 'inverno', 'primavera'], dica: 'Cresce em cerca de 40 dias. Colha antes de florescer para não amargar.' },
  { id: 'tomate', nome: 'Tomate-cereja', emoji: '🍅', tipo: 'Hortaliças', luz: 'Sol pleno, 6 h', rega: 2, vaso: 'Vaso de 30 L com tutor', est: ['primavera', 'verão'], dica: 'Amarre no tutor e regue na base, sem molhar as folhas.' },
  { id: 'pimenta', nome: 'Pimenta', emoji: '🌶️', tipo: 'Hortaliças', luz: 'Sol pleno, 6 h', rega: 3, vaso: 'Vaso de 20 L', est: ['primavera', 'verão'], dica: 'Colher os frutos maduros estimula a planta a produzir mais.' },
  { id: 'cebolinha', nome: 'Cebolinha', emoji: '🌿', tipo: 'Temperos', luz: 'Sol da manhã, 4 h', rega: 2, vaso: 'Vaso de 15 cm', est: TODAS, dica: 'Corte a 3 cm do chão e ela rebrota.' },
  { id: 'salsinha', nome: 'Salsinha', emoji: '🌿', tipo: 'Temperos', luz: 'Sol da manhã, 4 h', rega: 3, vaso: 'Vaso de 20 cm', est: ['outono', 'inverno', 'primavera'], dica: 'Semeie direto no vaso. A germinação pode levar até 3 semanas.' },
  { id: 'manjericao', nome: 'Manjericão', emoji: '🌱', tipo: 'Temperos', luz: 'Sol pleno, 5 h', rega: 2, vaso: 'Vaso de 20 cm', est: ['primavera', 'verão'], dica: 'Pince as pontas para ramificar e retire as flores.' },
  { id: 'hortela', nome: 'Hortelã', emoji: '🍃', tipo: 'Temperos', luz: 'Meia-sombra', rega: 2, vaso: 'Vaso só dela, pois se espalha', est: ['primavera', 'verão', 'outono'], dica: 'Cultive sozinha no vaso para não tomar o espaço das outras.' },
  { id: 'morango', nome: 'Morango', emoji: '🍓', tipo: 'Frutas', luz: 'Sol da manhã, 4 h', rega: 2, vaso: 'Jardineira ou vaso suspenso', est: ['outono', 'inverno'], dica: 'Evite molhar os frutos para não apodrecerem.' },
  { id: 'alho', nome: 'Alho', emoji: '🧄', tipo: 'Hortaliças', luz: 'Sol pleno, pelo menos 6 h', rega: 3, vaso: 'Vaso profundo, com boa drenagem', est: ['outono', 'inverno'], dica: 'Plante dentes sadios com a ponta voltada para cima. Evite encharcar; reduza a água perto da colheita.' },
  { id: 'cenoura', nome: 'Cenoura', emoji: '🥕', tipo: 'Hortaliças', luz: 'Sol pleno, 4 a 6 h ou mais', rega: 2, vaso: 'Vaso profundo, com terra solta', est: ['outono', 'inverno', 'primavera'], dica: 'Semeie no local definitivo e mantenha o solo uniformemente úmido durante a germinação.' },
  { id: 'tomate_comum', nome: 'Tomate', emoji: '🍅', tipo: 'Hortaliças', luz: 'Sol pleno, pelo menos 6 h', rega: 2, vaso: 'Vaso grande, de 20 a 30 L, com tutor', est: ['primavera', 'verão'], dica: 'Use tutor, mantenha a umidade regular e regue o solo sem molhar as folhas. Diferente do tomate-cereja do catálogo.' },
  { id: 'alecrim', nome: 'Alecrim', emoji: '🌿', tipo: 'Temperos', luz: 'Sol pleno, 6 h ou mais', rega: 4, vaso: 'Vaso com excelente drenagem', est: TODAS, dica: 'Deixe a camada superficial da terra secar entre regas; excesso de água prejudica as raízes.' },
  { id: 'oregano', nome: 'Orégano', emoji: '🌿', tipo: 'Temperos', luz: 'Sol pleno, 5 a 6 h', rega: 3, vaso: 'Vaso de 20 cm com drenagem', est: ['primavera', 'verão', 'outono'], dica: 'Pode as pontas para estimular novos ramos e evite solo encharcado.' },
  { id: 'quiabo', nome: 'Quiabo', emoji: '🌱', tipo: 'Hortaliças', luz: 'Sol pleno, 6 h ou mais', rega: 2, vaso: 'Vaso grande e profundo ou canteiro', est: ['primavera', 'verão'], dica: 'Prefere calor; colha os frutos ainda novos para manter a produção.' },
  { id: 'repolho', nome: 'Repolho', emoji: '🥬', tipo: 'Hortaliças', luz: 'Sol pleno, 4 a 6 h ou mais', rega: 2, vaso: 'Vaso grande, de 30 cm ou mais', est: ['outono', 'inverno'], dica: 'Mantenha irrigação regular e dê espaço para a formação da cabeça.' },
  { id: 'beterraba', nome: 'Beterraba', emoji: '🫜', tipo: 'Hortaliças', luz: 'Sol pleno, 4 a 6 h ou mais', rega: 2, vaso: 'Vaso de pelo menos 25 cm de profundidade', est: ['outono', 'inverno', 'primavera'], dica: 'Semeie diretamente no vaso ou canteiro e desbaste as mudas para as raízes crescerem.' },
  { id: 'coentro', nome: 'Coentro', emoji: '🌿', tipo: 'Temperos', luz: 'Sol da manhã ou sol pleno suave', rega: 2, vaso: 'Vaso de 20 cm ou jardineira', est: ['outono', 'inverno', 'primavera'], dica: 'Semeie direto no recipiente. Calor excessivo pode acelerar o florescimento.' },
  { id: 'pimentao', nome: 'Pimentão', emoji: '🫑', tipo: 'Hortaliças', luz: 'Sol pleno, 6 h ou mais', rega: 2, vaso: 'Vaso de 20 L ou maior, com tutor', est: ['primavera', 'verão'], dica: 'Mantenha umidade constante sem encharcar e proteja a planta de ventos fortes.', epocaPlantio: "Ago–Fev", tipoPlantio: "Mudas", cicloDias: "100–110", espacamentoConvencional: "1,00 × 0,50", espacamentoHPE: "0,70 × 0,35", producaoMudasDias: "30" }
];

PLANTAS.sort((a, b) =>
  a.nome.localeCompare(b.nome, 'pt-BR')
);

const DICAS = [
  'Use vasos com furo de drenagem e uma camada de argila expandida no fundo.',
  'Teste a rega: enfie o dedo 2 cm na terra. Se estiver seca, regue.',
  'Adube com casca de frutas e borra de café compostadas. Não use agrotóxicos.',
  'Controle pragas com calda de sabão neutro ou óleo de neem.',
  'No calor, cubra a terra com folhas secas para manter a umidade.',
  'Gire o vaso uma vez por semana para a planta crescer reta.'
];

const POSTS_INICIAIS = [
  { id: 1, autor: 'Dev.', plantaId: 'alface', texto: 'Primeira colheita na varanda do apartamento!', cor: '#dcedc8', alt: 220, emoji: '🥬' },
  { id: 2, autor: 'Dev.', plantaId: 'tomate', texto: 'Tomates-cereja no vaso de 30 L, já com tutor.', cor: '#ffd9cc', alt: 280, emoji: '🍅' },
  { id: 3, autor: 'Dev.', plantaId: 'hortela', texto: 'Hortelã sozinha no vaso, como recomendado.', cor: '#c8e6c9', alt: 180, emoji: '🍃' },
  { id: 4, autor: 'Dev.', plantaId: 'morango', texto: 'Jardineira de morangos no quintal pequeno.', cor: '#f8d7e0', alt: 250, emoji: '🍓' },
  { id: 5, autor: 'Dev.', plantaId: 'manjericao', texto: 'Manjericão pinçado toda semana.', cor: '#e6ee9c', alt: 200, emoji: '🌱' },
  { id: 6, autor: 'Dev.', plantaId: 'pimenta', texto: 'Pimenteira dando fruto na laje.', cor: '#ffe0b2', alt: 240, emoji: '🌶️' }
].map(p => ({ ...p, planta: PLANTAS.find(x => x.id === p.plantaId).nome, curtidas: 0, curtiu: false, comentarios: [] }));
