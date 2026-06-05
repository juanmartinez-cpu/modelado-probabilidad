// --- CONFIGURACIÓN GLOBAL DE GRÁFICOS (CHART.JS) ---
let chartC8 = null;
let chartC9 = null;
let datosC9Global = []; // Almacenar datos del CSV para cálculos dinámicos
let parametrosC9Global = {}; // Guardar parámetros calculados del dataset

document.addEventListener("DOMContentLoaded", () => {
    inicializarPestanas();
    inicializarControlesC8();
    inicializarControlesC9();
    
    // Render inicial por defecto
    ejecutarSimulacionC8();
});

// --- LÓGICA DE INTERFAZ (PESTAÑAS) ---
function inicializarPestanas() {
    const btnC8 = document.getElementById("btn-pestana-c8");
    const btnC9 = document.getElementById("btn-pestana-c9");
    const secC8 = document.getElementById("seccion-c8");
    const secC9 = document.getElementById("seccion-c9");

    btnC8.addEventListener("click", () => {
        btnC8.classList.add("active");
        btnC9.classList.remove("active");
        secC8.style.display = "block";
        secC9.style.display = "none";
    });

    btnC9.addEventListener("click", () => {
        btnC9.classList.add("active");
        btnC8.classList.remove("active");
        secC9.style.display = "block";
        secC8.style.display = "none";
    });
}

// --- FASE C8: SIMULACIÓN INTERACTIVA ---
function inicializarControlesC8() {
    const selectorDist = document.getElementById("selector-dist");
    const tipoCalculo = document.getElementById("tipo-calculo-c8");
    const contenedorX2 = document.getElementById("contenedor-x2");

    // Cambiar parámetros visibles según distribución
    selectorDist.addEventListener("change", () => {
        document.querySelectorAll(".grupo-parametros").forEach(el => el.style.display = "none");
        const distSeleccionada = selectorDist.value;
        if (distSeleccionada === "uniforme") document.getElementById("inputs-uniforme").style.display = "block";
        else if (distSeleccionada === "triangular") document.getElementById("inputs-triangular").style.display = "block";
        else if (distSeleccionada === "lineal") document.getElementById("inputs-lineal").style.display = "block";
        else if (distSeleccionada === "porpartes") document.getElementById("inputs-porpartes").style.display = "block";
        else if (distSeleccionada === "normal") document.getElementById("inputs-normal").style.display = "block";
    });

    // Ocultar campo X2 si se evalúa solo menor o mayor a un punto
    tipoCalculo.addEventListener("change", () => {
        if (tipoCalculo.value === "entre") {
            contenedorX2.style.display = "block";
        } else {
            contenedorX2.style.display = "none";
        }
    });

    document.getElementById("btn-calcular").addEventListener("click", ejecutarSimulacionC8);
}

// --- FUNCIONES DE DENSIDAD DE PROBABILIDAD (PDF) ---
function pdfUniforme(x, a, b) {
    return (x >= a && x <= b) ? (1 / (b - a)) : 0;
}

function pdfTriangular(x, a, b, c) {
    if (x < a || x > b) return 0;
    if (x >= a && x < c) return (2 * (x - a)) / ((b - a) * (c - a));
    if (x === c) return 2 / (b - a);
    return (2 * (b - x)) / ((b - a) * (b - c));
}

function pdfLineal(x, a, b, tipo) {
    if (x < a || x > b) return 0;
    const h = 2 / (b - a); // Altura máxima para que el área total sea 1
    if (tipo === "creciente") {
        return (h / (b - a)) * (x - a);
    } else {
        return h - (h / (b - a)) * (x - a);
    }
}

function pdfPorPartes(x) {
    // Definición fija de dos tramos uniformes continuos acoplados con Área total = 1
    // Tramo 1: [0, 4] con altura 0.15 -> Área = 0.60
    // Tramo 2: (4, 10] con altura 0.0666... -> Área = 0.40
    if (x >= 0 && x <= 4) return 0.15;
    if (x > 4 && x <= 10) return 0.40 / 6;
    return 0;
}

function pdfNormal(x, mu, sigma) {
    const exponente = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
}

// --- INTEGRADOR NUMÉRICO PARA CÁLCULO DE ÁREAS (PROBABILIDAD REAL) ---
function calcularProbabilidadMuestral(x1, x2, dist, params) {
    let area = 0;
    const pasos = 800;
    const inicio = Math.max(x1, params.minRef);
    const fin = Math.min(x2, params.maxRef);
    
    if (inicio >= fin) return 0;
    const dx = (fin - inicio) / pasos;

    for (let i = 0; i < pasos; i++) {
        const x = inicio + (i * dx) + (dx / 2);
        let y = 0;
        if (dist === "uniforme") y = pdfUniforme(x, params.a, params.b);
        else if (dist === "triangular") y = pdfTriangular(x, params.a, params.b, params.c);
        else if (dist === "lineal" || dist === "linear") y = pdfLineal(x, params.a, params.b, params.tipo);
        else if (dist === "porpartes" || dist === "piecewise") y = pdfPorPartes(x);
        else if (dist === "normal") y = pdfNormal(x, params.mu, params.sigma);
        area += y * dx;
    }
    return area;
}

function ejecutarSimulacionC8() {
    const dist = document.getElementById("selector-dist").value;
    const modoCalculo = document.getElementById("tipo-calculo-c8").value;
    
    let params = { minRef: -5, maxRef: 15 };
    let x1 = parseFloat(document.getElementById("prob-x1").value) || 0;
    let x2 = parseFloat(document.getElementById("prob-x2").value) || 0;

    // Capturar y validar parámetros según distribución
    if (dist === "uniforme") {
        params.a = parseFloat(document.getElementById("uni-a").value);
        params.b = parseFloat(document.getElementById("uni-b").value);
        if (params.a >= params.b) { alert("El límite 'a' debe ser menor que 'b'"); return; }
        params.minRef = params.a - (params.b - params.a) * 0.2;
        params.maxRef = params.b + (params.b - params.a) * 0.2;
    } else if (dist === "triangular") {
        params.a = parseFloat(document.getElementById("tri-a").value);
        params.b = parseFloat(document.getElementById("tri-b").value);
        params.c = parseFloat(
