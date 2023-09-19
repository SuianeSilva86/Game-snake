let tamanho = 1; // Começa com tamanho 1
let partesCobra = []; // Será um array para armazenhar as "bolinhas" partes do corpo

// desenho da bolinha
let xBolinha = 80;
let yBolinha = 500;
let diametro = 28;
let raio = diametro / 2; // o raio pega o inteiro da bolinha, ou seja quando ela bate nas bordas e constado como perda

let velocidadeX = 2; 
let velocidadeY = 2;

let imageComida; // desenho da comida
let comidaX, comidaY; //para que a comida pegue uma posição randomica e necessario que ela consiga se mover pelos eixos x e y

function preload() {
  imageComida = loadImage("img/noun-food-1242332.png"); //carregamento da img
}

function setup() {
  createCanvas(700, 700);
  comidaX = random(width - 25);  //coloca em uma posição aleatoria no eixo x
  comidaY = random(height - 25); //coloca em uma posição aleatoria no eixo y
}

function draw() {
  background(150);
  cobra(); 
  comida();
}

function cobra() {
  fill(0); //deixa os elementos em preto

//   // Adicione a cabeça da cobra às partes da cobra
 partesCobra.push(createVector(yBolinha, xBolinha)); // ele puxa a crição da "cauda" mas deixa ela escondida e so e mostrada quando movimentada

  if (partesCobra.length > tamanho) { // puxa todos os valores adicionados ao array da partesCobra e exibe quando a cobra e movimentada
    // Remova a cauda da cobra para manter o tamanho constante
    partesCobra[length];
  }

  // Desenhe a cobra 
  for (let i = 0; i < partesCobra.length; i++) { //faz um incremento normal usando as bolinhas como elemento parte da cobra 
    circle(partesCobra[i].x, partesCobra[i].y, diametro); // as bolinhas são incrementadas no array patesCobra nessa parte 
  }

  // movimento usando as teclas
  if (keyIsDown(UP_ARROW)) {
    xBolinha -= velocidadeY;
  } else if (keyIsDown(DOWN_ARROW)) {
    xBolinha += velocidadeY;
  } else if (keyIsDown(LEFT_ARROW)) {
    yBolinha -= velocidadeX;
  } else if (keyIsDown(RIGHT_ARROW)) {
    yBolinha += velocidadeX;
  }

  // Verifique a colisão com a comida
  let distancia = dist(yBolinha, xBolinha, comidaX + 12.5, comidaY + 12.5);
  if (distancia < raio + 12.5) {
    // Se a bolinha estiver próxima o suficiente da comida, aumente o tamanho
    tamanho++;
    // Adicione uma nova parte da cobra à cabeça
    partesCobra.push(createVector(yBolinha + 1, xBolinha + 1));
    // Randomize a posição da comida
    comidaX = random(width - 25);
    comidaY = random(height - 25);
    // Aumente a velocidade
    velocidadeX += 0.5;
    velocidadeY += 0.5;
  }

  function colisaoBordas() {
    if (
      xBolinha + raio > partesCobra ||
      xBolinha - raio < 0 ||
      yBolinha + raio > partesCobra ||
      yBolinha - raio < 0
    ) {
      text("Você perdeu", width / 2, height / 2);
    }
  }

  colisaoBordas();
}

function comida() {
  image(imageComida, comidaX, comidaY, 25, 25);
}
