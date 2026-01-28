const gerarBtn = document.getElementById("gerar");
const pdfBtn = document.getElementById("pdf");
const resultado = document.getElementById("resultado");

document.getElementById("refeicoes").addEventListener("input", function() {
  if (this.value < 1) this.value = 1;
  if (this.value > 6) this.value = 6;
});

// Tabela de alimentos (kcal por 100g)
const tabelaAlimentos = {
  "Arroz integral":130, "Arroz branco":129, "Feijão preto":95, "Feijão carioca":91,
  "Grão de bico":164, "Lentilha":116, "Quinoa":120, "Macarrão integral":124,
  "Macarrão branco":131, "Batata inglesa":77, "Batata doce":86, "Mandioca":160,
  "Cenoura":41, "Tomate":18, "Brócolis":34, "Espinafre":23, "Alface":15, "Pepino":16,
  "Abobrinha":17, "Frango grelhado":165, "Peito de frango":165, "Carne bovina magra":250,
  "Carne moída":260, "Peixe":206, "Salmão":208, "Atum":132, "Ovo":78, "Ovo cozido":78,
  "Queijo minas":264, "Queijo muçarela":280, "Leite integral":61, "Leite desnatado":35,
  "Iogurte natural":59, "Iogurte grego":59, "Banana":89, "Maçã":52, "Pera":57,
  "Mamão":43, "Abacate":160, "Laranja":47, "Uva":69, "Manga":60, "Azeite de oliva":884,
  "Óleo de coco":862, "Castanha de caju":553, "Amêndoas":579, "Nozes":654,
  "Semente de abóbora":559, "Semente de girassol":584, "Aveia":389, "Mel":304,
  "Chocolate amargo":546
};

gerarBtn.addEventListener("click", async () => {
  const nome = document.getElementById("nome").value;
  const idade = parseInt(document.getElementById("idade").value);
  const genero = document.getElementById("genero").value;
  const peso = parseFloat(document.getElementById("peso").value);
  const altura = parseFloat(document.getElementById("altura").value);
  const objetivo = document.getElementById("objetivo").value;
  const restricoes = document.getElementById("restricoes").value || "Nenhuma";
  let refeicoes = parseInt(document.getElementById("refeicoes").value);

  // Validação simples de refeições
  if(refeicoes < 1 || refeicoes > 6){
    alert("O número de refeições deve ser entre 1 e 6.");
    return;
  }

  resultado.innerText = "⏳ Gerando plano alimentar ⏳";

  // Calcula TMB
  let tmb = genero === "Masculino"
    ? 10 * peso + 6.25 * (altura*100) - 5*idade + 5
    : 10 * peso + 6.25 * (altura*100) - 5*idade - 161;

  // Meta calórica
  let metaMin, metaMax;
  if(objetivo==="Perda de Peso"){ metaMin=tmb-500; metaMax=tmb-300; }
  else if(objetivo==="Ganho de Massa"){ metaMin=tmb+300; metaMax=tmb+500; }
  else{ metaMin=metaMax=tmb; }

  // Refeições
  let secoes = [];
  if(refeicoes===1) secoes=["Refeição única"];
  else if(refeicoes===2) secoes=["Café da manhã","Jantar"];
  else if(refeicoes===3) secoes=["Café da manhã","Almoço","Jantar"];
  else if(refeicoes===4) secoes=["Café da manhã","Lanche da manhã","Almoço","Jantar"];
  else if(refeicoes===5) secoes=["Café da manhã","Lanche da manhã","Almoço","Lanche da tarde","Jantar"];
  else if(refeicoes===6) secoes=["Café da manhã","Lanche da manhã","Almoço","Lanche da tarde","Jantar","Ceia"];

  let tabelaTexto = Object.entries(tabelaAlimentos)
    .map(([nome, kcal]) => `${nome}=${kcal}kcal/100g`)
    .join(", ");

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"llama3.1",
        prompt: `
Você é um nutricionista virtual altamente qualificado.

=== INFORMAÇÕES DO PACIENTE ===
Nome: ${nome}
Idade: ${idade} anos
Gênero: ${genero}
Peso: ${peso} kg
Altura: ${altura} m
Objetivo: ${objetivo}
Restrições alimentares: ${restricoes}
Taxa Metabólica Basal (TMB): ${Math.round(tmb)} kcal
Meta calórica diária: intervalo entre ${metaMin} e ${metaMax} kcal
Número de refeições por dia: ${refeicoes}

=== TABELA DE ALIMENTOS ===
Use apenas esta tabela: ${tabelaTexto} para somar as calorias e definir as quantidades

=== INSTRUÇÕES ===
1) No começo do texto coloque as informações do paciente.
2) Distribua as calorias entre as refeições de forma natural.
3) Liste alimentos exclusivamente da tabela acima, com quantidade em gramas e calorias, garantindo que o total diário esteja no intervalo de ${metaMin} e ${metaMax} kcal.
4) Mostre o total de calorias no final de cada refeição.
5) Gere apenas uma dieta diária, não para vários dias ou semanas.
6) Respeite exatamente o número de refeições informado (${refeicoes}).
7) Texto limpo, organizado e fácil de ler.
8) Reforce que você é um nutricionista virtual garantindo saúde e equilíbrio.
9) Se necessário faça alterações na dieta para chegar no intervalo de calorias, depois que todas as alterações forem feitas mostre a dieta final com todas as refeições e porções de alimentos.
10) Não invente um total de calorias, faça o calculo de todas as calorias exatas.
11) Sempre verifique que o total de calorias está correto durante suas contas.
12) Faça quantas alterações forem precisas para chegar no intervalo de calorias, sem inventar um número total de calorias que nao existe.
13) Após a Dieta crie uma seção Cardapio de Receitas, onde mostra uma receita por refeição com modo de preparo.
14) Após o Cardápio de Receitas crie uma seção Compra da Semana, multiplicando a quantidade de alimentos da DIETA FINAL por 7.
15) Sempre escreva corretamente o nome das refeições usando esses nomes (${refeicoes}).
`,
        stream:false
      })
    });

    const text = await response.text();
    let resposta;
    try { resposta = JSON.parse(text).response || text; } catch{ resposta=text; }
    resultado.innerText = resposta.replace(/[*#]/g,"").trim() || "⚠️ Nenhum texto retornado.";
  } catch(e){
    resultado.innerText="⚠️ Erro ao conectar com a API.";
    console.error(e);
  }
});

pdfBtn.addEventListener("click", ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"mm", format:"a4" });
  const text = resultado.innerText || "Nenhum plano gerado ainda.";
  const lines = doc.splitTextToSize(text,180);

  doc.setFillColor(59,130,246);
  doc.rect(0,0,210,20,"F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(16);
  doc.text("Plano Alimentar Personalizado",10,14);

  let y=30;
  doc.setTextColor(0,0,0);
  doc.setFontSize(12);

  for(let line of lines){
    if(/informações do paciente/i.test(line)){
      doc.setFont("helvetica","bold"); doc.setTextColor(0,0,128); doc.setFontSize(13);
    } else if(/café|lanche|almoço|jantar|ceia/i.test(line)){
      doc.setFont("helvetica","bold"); doc.setTextColor(33,150,243); doc.setFontSize(14);
    } else if(/cardápio de receitas/i.test(line)){
      doc.setFont("helvetica","bold"); doc.setTextColor(0,128,0); doc.setFontSize(14);
    } else if(/compra da semana/i.test(line)){
      doc.setFont("helvetica","bold"); doc.setTextColor(150,75,0); doc.setFontSize(14);
    } else{
      doc.setFont("helvetica","normal"); doc.setTextColor(0,0,0); doc.setFontSize(12);
    }

    doc.text(line,10,y);
    y+=7;
    if(y>280){ doc.addPage(); y=20; }
  }

  doc.save("plano_alimentar.pdf");
});
