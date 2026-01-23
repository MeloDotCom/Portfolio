// Variável global para controlar z-index
let zIndexAtual = 100;

// Menu iniciar
$("#iniciar").on("click", function (e) {
  e.stopPropagation();
  $("#menuIniciar").toggleClass("aberto");
});

$(document).on("click", function () {
  $("#menuIniciar").removeClass("aberto");
});

$("#menuIniciar").on("click", function (e) {
  e.stopPropagation();
});

// Relógio
function atualizarRelogio() {
  const agora = new Date();
  $("#relogio").html(
    agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  );
  setTimeout(atualizarRelogio, 1000 - agora.getMilliseconds());
}
atualizarRelogio();

// Desktop icons
$(".desktop-icon").on("click", function (e) {
  e.stopPropagation();
  $(".desktop-icon").removeClass("selected");
  $(this).addClass("selected");
});

$(".area-de-trabalho").on("click", function () {
  $(".desktop-icon").removeClass("selected");
});

// Sistema de grid para ícones
const GRID_X = 100;
const GRID_Y = 115;
const grid = {};
const gridKey = (x, y) => `${x}_${y}`;
const getMaxRows = () => Math.floor($(".area-de-trabalho").height() / GRID_Y) - 1;

function initGrid() {
  Object.keys(grid).forEach(key => delete grid[key]);
  
  let col = 0, row = 0;
  const maxRows = getMaxRows();
  
  $(".desktop-icon").each(function() {
    while (row >= maxRows || grid[gridKey(col, row)]) {
      if (++row >= maxRows) {
        row = 0;
        col++;
      }
    }
    
    $(this).css({ left: col * GRID_X, top: row * GRID_Y });
    grid[gridKey(col, row)] = this;
    row++;
  });
}

function findNearestFreeCellInDirection(startX, startY, fromX, fromY) {
  const maxRows = getMaxRows();
  const maxCols = Math.ceil($(".area-de-trabalho").width() / GRID_X);
  
  const dirX = startX - fromX;
  const dirY = startY - fromY;
  
  const freeCells = [];
  
  for (let col = 0; col < maxCols; col++) {
    for (let row = 0; row < maxRows; row++) {
      if (!grid[gridKey(col, row)]) {
        const dx = col - startX;
        const dy = row - startY;
        const dist = dx ** 2 + dy ** 2;
        const dotProduct = dx * dirX + dy * dirY;
        freeCells.push({ x: col, y: row, dist, dotProduct });
      }
    }
  }
  
  if (freeCells.length > 0) {
    freeCells.sort((a, b) => {
      if (a.dotProduct > 0 && b.dotProduct <= 0) return -1;
      if (b.dotProduct > 0 && a.dotProduct <= 0) return 1;
      return a.dist - b.dist;
    });
    return { x: freeCells[0].x, y: freeCells[0].y };
  }
  
  return { x: startX, y: startY };
}

$(".desktop-icon").draggable({
  containment: ".area-de-trabalho",
  start: function() {
    const pos = $(this).position();
    const gx = Math.round(pos.left / GRID_X);
    const gy = Math.round(pos.top / GRID_Y);
    $(this).data("originGrid", { x: gx, y: gy });
    delete grid[gridKey(gx, gy)];
  },
  stop: function(event, ui) {
    let gx = Math.round(ui.position.left / GRID_X);
    let gy = Math.round(ui.position.top / GRID_Y);
    const maxRows = getMaxRows();
    
    if (gy >= maxRows || grid[gridKey(gx, gy)]) {
      const origin = $(this).data("originGrid");
      const nearest = findNearestFreeCellInDirection(gx, gy, origin.x, origin.y);
      gx = nearest.x;
      gy = nearest.y;
    }
    
    grid[gridKey(gx, gy)] = this;
    $(this).animate({ left: gx * GRID_X, top: gy * GRID_Y }, 150);
  }
});

// ============ SISTEMA DE JANELAS ============

function abrirJanela(idJanela) {
  const $janela = $("#" + idJanela);
  
  // Marca que foi aberta
  $janela.data("foiAberta", true);
  
  // Se já está aberta, apenas traz para frente
  if ($janela.is(":visible") && !$janela.hasClass("minimizada")) {
    trazerParaFrente($janela);
    return;
  }
  
  // Remove minimizada e mostra
  $janela.removeClass("minimizada").show();
  trazerParaFrente($janela);
  atualizarBarraTarefas();
  $("#menuIniciar").removeClass("aberto");
}

function fecharJanela($janela) {
  $janela.hide().removeClass("ativa maximizada minimizada");
  $janela.data("foiAberta", false);
  atualizarBarraTarefas();
}

function minimizarJanela($janela) {
  $janela.addClass("minimizada").removeClass("ativa");
  atualizarBarraTarefas();
}

function maximizarJanela($janela) {
  if ($janela.hasClass("maximizada")) {
    $janela.removeClass("maximizada");
  } else {
    $janela.addClass("maximizada");
  }
}

function trazerParaFrente($janela) {
  $(".janela").removeClass("ativa");
  $janela.addClass("ativa").css("z-index", ++zIndexAtual);
  atualizarBarraTarefas();
}

function atualizarBarraTarefas() {
  const $container = $(".janelas-abertas");
  $container.empty();
  
  // Pega todas as janelas que foram abertas (não estão com display:none inicial)
  $(".janela").each(function() {
    const $janela = $(this);
    
    // Só mostra na barra se foi aberta pelo menos uma vez
    if ($janela.data("foiAberta")) {
      const titulo = $janela.find(".titulo-texto span").text();
      const icone = $janela.find(".titulo-texto img").attr("src");
      const id = $janela.attr("id");
      const ativa = $janela.hasClass("ativa") && !$janela.hasClass("minimizada");
      
      const $botao = $(`
        <div class="botao-janela ${ativa ? 'ativa' : ''}" data-janela="${id}">
          <img src="${icone}" alt="">
          <span>${titulo}</span>
        </div>
      `);
      
      $botao.on("click", function() {
        const $j = $("#" + id);
        if ($j.hasClass("minimizada")) {
          $j.removeClass("minimizada");
          trazerParaFrente($j);
        } else if ($j.hasClass("ativa")) {
          minimizarJanela($j);
        } else {
          trazerParaFrente($j);
        }
      });
      
      $container.append($botao);
    }
  });
}

// Tornar janelas arrastáveis
$(".janela").draggable({
  handle: ".barra-titulo",
  containment: ".area-de-trabalho",
  start: function() {
    trazerParaFrente($(this));
  }
});

// Tornar janelas redimensionáveis
$(".janela").resizable({
  minWidth: 400,
  minHeight: 300,
  handles: "n, e, s, w, ne, se, sw, nw"
});

// Eventos dos botões das janelas
$(".btn-fechar").on("click", function() {
  fecharJanela($(this).closest(".janela"));
  const som = document.getElementById('closeSound');
    closeSound.volume = 0.2; // 50% do volume
    som.play().catch(() => {
    });
});

$(".btn-minimizar").on("click", function() {
  minimizarJanela($(this).closest(".janela"));
});

$(".btn-maximizar").on("click", function() {
  maximizarJanela($(this).closest(".janela"));
});

// Trazer janela para frente ao clicar nela
$(".janela").on("mousedown", function() {
  trazerParaFrente($(this));
});

// Duplo clique nos ícones abre janela
$(".desktop-icon").on("dblclick", function(e) {
  e.stopPropagation();
  const idJanela = $(this).data("janela");
  if (idJanela) {
    abrirJanela(idJanela);
  }
});

// Clique nos itens do menu iniciar abre janela
$(".itemIniciar").on("click", function() {
  const idJanela = $(this).data("janela");
  if (idJanela === "janela-linkedin") {
    window.open('https://www.linkedin.com/in/cauã-melo-portela/', '_blank');
    return;
  }
  if (idJanela) {
    abrirJanela(idJanela);
  }
});

// Duplo clique na barra de título maximiza
$(".barra-titulo").on("dblclick", function() {
  maximizarJanela($(this).closest(".janela"));
});

// Inicializar grid
$(window).on("load", initGrid);