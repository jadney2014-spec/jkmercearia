import { fixUtf8MojibakeDeep } from '../utils/textEncoding';

// Serviço para gerenciar estudos bíblicos diários
export interface Estudo {
  id: number;
  titulo: string;
  versiculo: string;
  texto: string;
  reflexao: string;
  oracao: string;
  data: string;
  autor?: string;
  categoria?: string;
  tags?: string[];
}

// Simulação de banco de dados de estudos
const estudosDatabase: Estudo[] = [
  {
    id: 1,
    titulo: "A Força da Oração",
    versiculo: "Mateus 21:22",
    texto: "E tudo o que pedirdes na oração, crendo, recebereis.",
    reflexao: "A oração é uma das ferramentas mais poderosas que Deus nos deu. Quando oramos com fé, estamos exercitando nossa confiança no Senhor e abrindo nossos corações para Sua vontade. A oração não é apenas pedir, mas também agradecer, adorar e buscar orientação. Em momentos de dificuldade, a oração nos conecta diretamente com o Pai celestial, que conhece nossas necessidades antes mesmo de as expressarmos.",
    oracao: "Senhor, ensina-me a orar com fé verdadeira. Ajuda-me a confiar em Ti em todas as situações e a buscar sempre a Tua vontade. Que minha vida seja uma oração constante de gratidão e adoração. Fortalece minha fé para que eu possa ver os Teus milagres em minha vida. Amém.",
    data: new Date().toISOString().split('T')[0],
    autor: "Apóstolo Isac",
    categoria: "Oração",
    tags: ["oração", "fé", "confiança"]
  },
  {
    id: 2,
    titulo: "O Amor Incondicional",
    versiculo: "João 3:16",
    texto: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    reflexao: "O amor de Deus é incomparável e incondicional. Ele nos amou tanto que enviou Seu único Filho para morrer por nós. Este amor não depende de nossos méritos ou ações, mas é puro e eterno. Devemos refletir este amor em nossas vidas, amando uns aos outros como Cristo nos amou. O amor de Deus transforma vidas e quebra barreiras.",
    oracao: "Pai celestial, obrigado pelo Teu amor incondicional. Ajuda-me a compreender a profundidade deste amor e a compartilhá-lo com outros. Que eu seja um instrumento do Teu amor neste mundo, mostrando compaixão e misericórdia a todos que encontro. Amém.",
    data: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    autor: "Apóstola Elaine",
    categoria: "Amor",
    tags: ["amor", "salvação", "sacrifício"]
  },
  {
    id: 3,
    titulo: "A Fé que Move Montanhas",
    versiculo: "Marcos 11:23",
    texto: "Porque em verdade vos digo que qualquer que disser a este monte: Ergue-te e lança-te no mar, e não duvidar no seu coração, mas crer que se fará aquilo que diz, tudo o que disser lhe será feito.",
    reflexao: "A fé verdadeira não é apenas acreditar que Deus pode fazer algo, mas confiar completamente nEle. Quando nossa fé está alinhada com a vontade de Deus, milagres acontecem. A fé remove obstáculos e abre caminhos impossíveis. É através da fé que vemos o invisível e alcançamos o impossível.",
    oracao: "Senhor, fortalece minha fé. Ajuda-me a confiar completamente em Ti, mesmo quando não entendo os Teus caminhos. Que minha fé seja genuína e transformadora, capaz de mover montanhas e realizar milagres em Tua glória. Amém.",
    data: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    autor: "Pastor Jadney",
    categoria: "Fé",
    tags: ["fé", "milagres", "confiança"]
  },
  {
    id: 4,
    titulo: "A Paz que Excede Todo Entendimento",
    versiculo: "Filipenses 4:7",
    texto: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos sentimentos em Cristo Jesus.",
    reflexao: "A paz de Deus é diferente da paz do mundo. Enquanto a paz do mundo depende das circunstâncias, a paz de Deus é independente delas. É uma paz que guarda nossos corações e mentes, mesmo em meio às tempestades da vida. Esta paz só pode ser encontrada em Cristo Jesus.",
    oracao: "Senhor, concede-me a Tua paz que excede todo entendimento. Que mesmo em meio às dificuldades, eu possa experimentar a Tua tranquilidade e confiança. Guarda meu coração e minha mente em Cristo Jesus. Amém.",
    data: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    autor: "Pastora Fran",
    categoria: "Paz",
    tags: ["paz", "tranquilidade", "confiança"]
  },
  {
    id: 5,
    titulo: "A Esperança em Cristo",
    versiculo: "Romanos 15:13",
    texto: "Ora, o Deus de esperança vos encha de todo o gozo e paz na vossa fé, para que abundeis na esperança pela virtude do Espírito Santo.",
    reflexao: "A esperança cristã não é uma ilusão ou um desejo vago, mas uma certeza baseada nas promessas de Deus. É uma esperança que nos enche de gozo e paz, mesmo quando as circunstâncias são difíceis. Esta esperança vem do Espírito Santo e nos sustenta em todos os momentos.",
    oracao: "Deus de esperança, enche-me de todo gozo e paz na minha fé. Que eu possa abundar na esperança pela virtude do Teu Espírito Santo. Ajuda-me a confiar nas Tuas promessas e a viver com expectativa do que Tu farás. Amém.",
    data: new Date(Date.now() - 345600000).toISOString().split('T')[0],
    autor: "Pastora Kele",
    categoria: "Esperança",
    tags: ["esperança", "gozo", "paz"]
  },
  {
    id: 6,
    titulo: "A Comunhão dos Santos",
    versiculo: "Hebreus 10:24-25",
    texto: "E consideremo-nos uns aos outros para nos estimularmos ao amor e às boas obras. Não deixando a nossa congregação, como é costume de alguns, antes admoestando-nos uns aos outros; e tanto mais, quanto vedes que se vai aproximando aquele dia.",
    reflexao: "A comunhão cristã é essencial para nosso crescimento espiritual. Quando nos reunimos como irmãos e irmãs em Cristo, somos fortalecidos, encorajados e edificados. A igreja não é apenas um prédio, mas o corpo de Cristo, onde cada membro tem um papel importante.",
    oracao: "Senhor, ajuda-me a valorizar a comunhão com meus irmãos na fé. Que eu possa ser um encorajamento para outros e receber encorajamento deles. Fortalece nossa igreja para que sejamos um testemunho do Teu amor. Amém.",
    data: new Date(Date.now() - 432000000).toISOString().split('T')[0],
    autor: "Pastor Leomar",
    categoria: "Comunhão",
    tags: ["comunhão", "igreja", "encorajamento"]
  },
  {
    id: 7,
    titulo: "Servindo com Excelência",
    versiculo: "Colossenses 3:23-24",
    texto: "E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens, sabendo que recebereis do Senhor o galardão da herança, porque a Cristo, o Senhor, servis.",
    reflexao: "Servir a Deus não é apenas um dever, é um privilégio. Quando servimos com excelência, refletimos o caráter de Cristo e glorificamos o nome do Senhor. Cada ato de serviço, por menor que seja, tem valor eterno no reino de Deus.",
    oracao: "Senhor, ensina-me a servir com excelência e de todo coração. Que eu possa fazer tudo para a Tua glória, não para agradar aos homens, mas para honrar o Teu nome. Usa-me como instrumento do Teu amor. Amém.",
    data: new Date(Date.now() - 518400000).toISOString().split('T')[0],
    autor: "Pastor Elcio",
    categoria: "Serviço",
    tags: ["serviço", "excelência", "dedicação"]
  },
  {
    id: 8,
    titulo: "A Transformação pelo Espírito",
    versiculo: "2 Coríntios 3:18",
    texto: "Mas todos nós, com rosto descoberto, refletindo como um espelho a glória do Senhor, somos transformados de glória em glória na mesma imagem, como pelo Espírito do Senhor.",
    reflexao: "A transformação cristã é um processo contínuo que acontece através do Espírito Santo. À medida que contemplamos a glória do Senhor, somos transformados à Sua imagem. Esta transformação não é apenas externa, mas principalmente interna, moldando nosso caráter e nosso coração.",
    oracao: "Espírito Santo, transforma-me à imagem de Cristo. Remove tudo que não agrada ao Senhor e molda meu caráter segundo a Sua vontade. Que eu possa refletir a glória de Deus em minha vida. Amém.",
    data: new Date(Date.now() - 604800000).toISOString().split('T')[0],
    autor: "Pastora Eneize",
    categoria: "Transformação",
    tags: ["transformação", "Espírito Santo", "crescimento"]
  },
  {
    id: 9,
    titulo: "A Sabedoria que Vem do Alto",
    versiculo: "Tiago 3:17",
    texto: "Mas a sabedoria que vem do alto é primeiramente pura, depois pacífica, moderada, tratável, cheia de misericórdia e de bons frutos, sem parcialidade, e sem hipocrisia.",
    reflexao: "A sabedoria divina é diferente da sabedoria humana. Ela é pura, pacífica e cheia de misericórdia. Quando buscamos esta sabedoria, nossas decisões são guiadas pelo Espírito Santo e refletem o caráter de Cristo. Esta sabedoria nos ajuda a viver em harmonia com outros e a fazer escolhas que glorificam a Deus.",
    oracao: "Senhor, concede-me a sabedoria que vem do alto. Que eu possa tomar decisões guiadas pelo Teu Espírito e viver de forma que glorifique o Teu nome. Ajuda-me a ser puro, pacífico e misericordioso em todas as minhas ações. Amém.",
    data: new Date(Date.now() - 691200000).toISOString().split('T')[0],
    autor: "Pastor Thiago",
    categoria: "Sabedoria",
    tags: ["sabedoria", "decisões", "caráter"]
  },
  {
    id: 10,
    titulo: "O Amor que Não Falha",
    versiculo: "1 Coríntios 13:8",
    texto: "O amor nunca falha; mas havendo profecias, serão aniquiladas; havendo línguas, cessarão; havendo ciência, desaparecerá.",
    reflexao: "O amor de Deus é eterno e nunca falha. Enquanto outras coisas podem passar, o amor permanece para sempre. Este amor nos capacita a amar outros de forma incondicional, mesmo quando é difícil. É através do amor que demonstramos o caráter de Cristo ao mundo.",
    oracao: "Pai celestial, ensina-me a amar como Tu amas. Que meu amor seja genuíno, incondicional e transformador. Ajuda-me a demonstrar Teu amor através de minhas ações e palavras. Que eu seja um instrumento do Teu amor neste mundo. Amém.",
    data: new Date(Date.now() - 777600000).toISOString().split('T')[0],
    autor: "Pastora Rany",
    categoria: "Amor",
    tags: ["amor", "eternidade", "transformação"]
  },
  // Novos estudos de Fé
  {
    id: 11,
    titulo: "Confiança Inabalável",
    versiculo: "Isaías 26:3",
    texto: "Tu conservarás em paz aquele cuja mente está firme em ti; porque ele confia em ti.",
    reflexao: "A confiança em Deus é a base de uma vida estável e pacífica. Quando nossa mente está firmemente focada em Deus, Ele nos conserva em paz, independentemente das circunstâncias externas. Esta confiança não é passiva, mas ativa - é uma escolha diária de depositar nossa fé no Senhor.",
    oracao: "Senhor, fortalece minha confiança em Ti. Ajuda-me a manter minha mente firme em Ti, mesmo quando as circunstâncias são desafiadoras. Que eu possa experimentar a Tua paz que vem da confiança genuína. Amém.",
    data: new Date(Date.now() - 864000000).toISOString().split('T')[0],
    autor: "Pastor Jadney",
    categoria: "Fé",
    tags: ["confiança", "paz", "estabilidade"]
  },
  {
    id: 12,
    titulo: "A Fé dos Gigantes",
    versiculo: "Hebreus 11:1",
    texto: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.",
    reflexao: "A fé é o fundamento sólido que sustenta nossas esperanças e a evidência das realidades invisíveis. Os heróis da fé mencionados em Hebreus 11 não eram perfeitos, mas tinham uma característica em comum: confiavam completamente em Deus. Sua fé os capacitou a fazer coisas extraordinárias e a perseverar em meio às dificuldades.",
    oracao: "Senhor, desenvolve em mim a fé dos gigantes. Ajuda-me a ver além das circunstâncias visíveis e a confiar nas Tuas promessas invisíveis. Que minha fé seja um firme fundamento que sustente todas as minhas esperanças. Amém.",
    data: new Date(Date.now() - 950400000).toISOString().split('T')[0],
    autor: "Pastora Fran",
    categoria: "Fé",
    tags: ["fé", "fundamento", "heróis"]
  },
  // Novos estudos de Esperança
  {
    id: 13,
    titulo: "Esperança Renovada",
    versiculo: "Lamentações 3:22-23",
    texto: "As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.",
    reflexao: "Mesmo nos momentos mais sombrios da vida, as misericórdias de Deus se renovam a cada manhã. Sua fidelidade é grande e constante. Esta verdade nos dá esperança renovada para cada novo dia, sabendo que Deus está sempre presente e ativo em nossa vida.",
    oracao: "Senhor, obrigado pelas Tuas misericórdias que se renovam a cada manhã. Ajuda-me a confiar na Tua grande fidelidade, mesmo quando não vejo o caminho à frente. Renova minha esperança e fortalece minha confiança em Ti. Amém.",
    data: new Date(Date.now() - 1036800000).toISOString().split('T')[0],
    autor: "Apóstola Elaine",
    categoria: "Esperança",
    tags: ["esperança", "misericórdia", "fidelidade"]
  },
  {
    id: 14,
    titulo: "O Amanhã Pertence a Deus",
    versiculo: "Jeremias 29:11",
    texto: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.",
    reflexao: "Deus tem planos específicos para cada um de nós - planos de paz e prosperidade, não de mal. Quando entregamos nosso futuro nas mãos de Deus, podemos descansar na certeza de que Ele está trabalhando para o nosso bem. O amanhã pertence a Ele, e podemos confiar nisso.",
    oracao: "Senhor, entrego meu futuro em Tuas mãos. Ajuda-me a confiar nos Teus pensamentos de paz para minha vida. Que eu possa descansar na certeza de que Tu tens o melhor planejado para mim. Amém.",
    data: new Date(Date.now() - 1123200000).toISOString().split('T')[0],
    autor: "Pastor Jadney",
    categoria: "Esperança",
    tags: ["futuro", "planos", "paz"]
  },
  // Palavras de Coach
  {
    id: 15,
    titulo: "Desperte o Gigante Interior",
    versiculo: "Filipenses 4:13",
    texto: "Posso todas as coisas naquele que me fortalece.",
    reflexao: "Dentro de cada um de nós existe um potencial ilimitado que só pode ser despertado através da força que vem de Cristo. Não somos limitados por nossas próprias capacidades, mas sim fortalecidos pelo poder de Deus. Quando reconhecemos nossa dependência dEle, descobrimos que podemos fazer muito mais do que imaginávamos.",
    oracao: "Senhor, desperta o gigante interior que há em mim. Ajuda-me a reconhecer que posso todas as coisas através da Tua força. Remove as limitações que coloquei sobre mim mesmo e capacita-me para cumprir o propósito que tens para minha vida. Amém.",
    data: new Date(Date.now() - 1209600000).toISOString().split('T')[0],
    autor: "Coach Cristão",
    categoria: "Palavras de Coach",
    tags: ["potencial", "força", "capacitação"]
  },
  {
    id: 16,
    titulo: "Mindset Vencedor",
    versiculo: "Romanos 12:2",
    texto: "E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento, para que experimenteis qual seja a boa, agradável e perfeita vontade de Deus.",
    reflexao: "Um mindset vencedor começa com a renovação da mente. Precisamos transformar nossa forma de pensar, deixando de lado os padrões do mundo e abraçando a perspectiva de Deus. Esta transformação nos capacita a discernir e viver a vontade perfeita de Deus.",
    oracao: "Senhor, renova minha mente e transforma meu entendimento. Ajuda-me a não me conformar com os padrões do mundo, mas a pensar como Tu pensas. Que eu possa experimentar e viver a Tua vontade perfeita. Amém.",
    data: new Date(Date.now() - 1296000000).toISOString().split('T')[0],
    autor: "Coach Cristão",
    categoria: "Palavras de Coach",
    tags: ["mindset", "transformação", "renovação"]
  },
  // Palavras de Esperança
  {
    id: 17,
    titulo: "Consolo para o Coração Ferido",
    versiculo: "Salmo 34:18",
    texto: "Perto está o Senhor dos que têm o coração quebrantado, e salva os contritos de espírito.",
    reflexao: "Deus não está distante quando nosso coração está ferido. Ele se aproxima especialmente dos quebrantados e contritos. Sua presença é um bálsamo para nossa dor, e Sua salvação é nossa esperança. Em meio ao sofrimento, podemos encontrar consolo na certeza de que Ele está próximo.",
    oracao: "Senhor, obrigado por estares próximo quando meu coração está ferido. Ajuda-me a sentir a Tua presença consoladora e a encontrar esperança em Ti. Cura minhas feridas e restaura minha alegria. Amém.",
    data: new Date(Date.now() - 1382400000).toISOString().split('T')[0],
    autor: "Ministério de Consolação",
    categoria: "Palavras de Esperança",
    tags: ["consolo", "cura", "presença"]
  },
  {
    id: 18,
    titulo: "Novos Caminhos, Novas Possibilidades",
    versiculo: "Isaías 43:19",
    texto: "Eis que farei uma coisa nova, agora sairá à luz; porventura não a percebeis? Eis que porei um caminho no deserto, e rios no ermo.",
    reflexao: "Deus está sempre fazendo coisas novas em nossa vida. Mesmo quando parece que estamos no deserto, Ele pode abrir caminhos onde não existiam e fazer brotar rios em lugares secos. Sua criatividade e poder não têm limites, e Ele pode transformar qualquer situação em uma nova possibilidade.",
    oracao: "Senhor, abre meus olhos para ver as coisas novas que estás fazendo. Ajuda-me a perceber os novos caminhos e possibilidades que tens para minha vida. Que eu possa confiar em Ti mesmo quando estou no deserto. Amém.",
    data: new Date(Date.now() - 1468800000).toISOString().split('T')[0],
    autor: "Ministério de Consolação",
    categoria: "Palavras de Esperança",
    tags: ["novos caminhos", "possibilidades", "renovação"]
  }
];

// Função para obter o estudo do dia
export const getEstudoDoDia = (): Promise<Estudo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hoje = new Date().toISOString().split('T')[0];
      const estudo = estudosDatabase.find(e => e.data === hoje) || estudosDatabase[0];
      resolve(fixUtf8MojibakeDeep(estudo));
    }, 500);
  });
};

// Função para obter todos os estudos
export const getAllEstudos = (): Promise<Estudo[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fixUtf8MojibakeDeep(estudosDatabase.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())));
    }, 300);
  });
};

// Função para obter estudos por categoria
export const getEstudosPorCategoria = (categoria: string): Promise<Estudo[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const estudos = estudosDatabase.filter(e => e.categoria === categoria);
      resolve(fixUtf8MojibakeDeep(estudos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())));
    }, 300);
  });
};

// Função para adicionar novo estudo (simulação)
export const adicionarEstudo = (estudo: Omit<Estudo, 'id'>): Promise<Estudo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const novoEstudo: Estudo = {
        ...estudo,
        id: estudosDatabase.length + 1
      };
      estudosDatabase.unshift(novoEstudo);
      resolve(fixUtf8MojibakeDeep(novoEstudo));
    }, 500);
  });
};

// Função para obter categorias disponíveis
export const getCategorias = (): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const categorias = Array.from(new Set(estudosDatabase.map(e => e.categoria).filter(Boolean) as string[]));
      resolve(fixUtf8MojibakeDeep(categorias));
    }, 200);
  });
};

// Função para obter estudos por data
export const getEstudoPorData = (data: string): Promise<Estudo | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const estudo = estudosDatabase.find(e => e.data === data) || null;
      resolve(fixUtf8MojibakeDeep(estudo));
    }, 300);
  });
};
