let miGraficoC8;
let miGraficoC9;
let datosCargadosGlobal = [];

// ==========================================
// CONTROL DE PESTAÑAS (NAVEGACIÓN)
// ==========================================
document.getElementById('btn-pestana-c8').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('btn-pestana-c9').classList.remove('active');
    document.getElementById('seccion-c8').style.display = 'block';
    document.getElementById('seccion-c9').style.display = 'none';
});

document.getElementById('btn-pestana-c9').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('btn-pestana-c8').classList.remove('active');
    document.getElementById('seccion-c9').style.display = 'block';
    document.getElementById('seccion-c8').style.display = 'none';
    if(!miGraficoC9) ejecutarModeladoC9();
});

// ==========================================
// MATEMÁTICA Y DENSIDADES (PDF) - C8
// ==========================================
function pdfUniforme(x, a, b) { return (x >= a && x <= b) ? (1 / (b - a)) : 0; }

function pdfTriangular(x, a, b, c) {
    if (x < a || x > b) return 0;
    if (x >= a && x < c) return (2 * (x - a)) / ((b - a) * (c - a));
    if (x === c) return 2 / (b - a);
    if (x > c && x <= b) return (2 * (b - x)) / ((b - a) * (b - c));
    return 0;
}

function pdfLineal(x, a, b, tipo) {
    if (x < a || x > b) return 0;
    const h = 2 / (b - a);
    return (tipo === 'creciente') ? (h / (b - a)) * (x - a) : h - (h / (b - a)) * (x - a);
}

function pdfPorPartes(x) {
    if (x >= 0 && x < 4) return 0.1;
    if (x >= 4 && x <= 10) return 0.1;
    return 0;
}

function pdfNormal(x, mu, sigma) {
    const exponente = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
}

// Integración Numérica (Regla del Punto Medio) para calcular áreas bajo la curva reales
function calcularAreaBajoCurva(x1, x2, dist, params) {
    let area = 0; const pasos = 800;
    const inicio = Math.max(x1, params.minRef); const fin = Math.min(x2, params.maxRef);
    if (inicio >= fin) return 0;
    const dx = (fin - inicio) / pasos;
    for (let i = 0; i < pasos; i++) {
        const x = inicio + (i * dx) + (dx / 2);
        let y = 0;
        if (dist === 'uniforme') y = pdfUniforme(x, params.a, params.b);
        else if (dist === 'triangular') y = pdfTriangular(x, params.a, params.b, params.c);
        else if (dist === 'lineal') y = pdfLineal(x, params.a, params.b, params.tipo);
        else if (dist === 'porpartes') y = pdfPorPartes(x);
        else if (dist === 'normal') y = pdfNormal(x, params.mu, params.sigma);
        area += y * dx;
    }
    return area;
}

function actualizarSimulacionC8() {
    const dist = document.getElementById('selector-dist').value;
    const x1 = parseFloat(document.getElementById('prob-x1').value);
    const x2 = parseFloat(document.getElementById('prob-x2').value);
    let params = {}; let inicioG, finG;

    if (dist === 'uniforme') {
        params.a = parseFloat(document.getElementById('uni-a').value);
        params.b = parseFloat(document.getElementById('uni-b').value);
        params.minRef = params.a; params.maxRef = params.b;
        inicioG = params.a - (params.b - params.a)*0.2; finG = params.b + (params.b - params.a)*0.2;
    } else if (dist === 'triangular') {
        params.a = parseFloat(document.getElementById('tri-a').value);
        params.b = parseFloat(document.getElementById('tri-b').value);
        params.c = parseFloat(document.getElementById('tri-c').value);
        params.minRef = params.a; params.maxRef = params.b;
        inicioG = params.a - (params.b - params.a)*0.1; finG = params.b + (params.b - params.a)*0.1;
    } else if (dist === 'lineal') {
        params.a = parseFloat(document.getElementById('lin-a').value);
        params.b = parseFloat(document.getElementById('lin-b').value);
        params.tipo = document.getElementById('lin-tipo').value;
        params.minRef = params.a; params.maxRef = params.b;
        inicioG = params.a - (params.b - params.a)*0.1; finG = params.b + (params.b - params.a)*0.1;
    } else if (dist === 'porpartes') {
        params.minRef = 0; params.maxRef = 10; inicioG = -1; finG = 11;
    } else if (dist === 'normal') {
        params.mu = parseFloat(document.getElementById('norm-mu').value);
        params.sigma = parseFloat(document.getElementById('norm-sigma').value);
        params.minRef = params.mu - 4*params.sigma; params.maxRef = params.mu + 4*params.sigma;
        inicioG = params.mu - 4*params.sigma; finG = params.mu + 4*params.sigma;
    }

    const eX = []; const dY = []; const pasos = 120; const inc = (finG - inicioG) / pasos;
    for (let i = 0; i <= pasos; i++) {
        let x = inicioG + (i * inc); let y = 0;
        if (dist === 'uniforme') y = pdfUniforme(x, params.a, params.b);
        else if (dist === 'triangular') y = pdfTriangular(x, params.a, params.b, params.c);
        else if (dist === 'lineal') y = pdfLineal(x, params.a, params.b, params.tipo);
        else if (dist === 'porpartes') y = pdfPorPartes(x);
        else if (dist === 'normal') y = pdfNormal(x, params.mu, params.sigma);
        eX.push(x); dY.push(y);
    }

    let p = calcularAreaBajoCurva(x1, x2, dist, params);
    document.getElementById('valor-p').innerText = p.toFixed(4);

    if (miGraficoC8) miGraficoC8.destroy();
    const ctx = document.getElementById('graficoPDF').getContext('2d');
    miGraficoC8 = new Chart(ctx, {
        type: 'line',
        data: {
            labels: eX.map(v => v.toFixed(2)),
            datasets: [{
                label: 'Densidad f(x)', data: dY, borderColor: '#1e3a8a', borderWidth: 2.5, pointRadius: 0, fill: true,
                segment: { backgroundColor: c => (eX[c.p0DataIndex] >= x1 && eX[c.p0DataIndex] <= x2) ? 'rgba(37, 99, 235, 0.35)' : 'transparent' }
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

document.getElementById('selector-dist').addEventListener('change', function() {
    document.querySelectorAll('.grupo-parametros').forEach(el => el.style.display = 'none');
    document.getElementById(`inputs-${this.value}`).style.display = 'block';
    actualizarSimulacionC8();
});
document.getElementById('btn-calcular').addEventListener('click', actualizarSimulacionC8);


// ==========================================
// PROCESAMIENTO MASIVO INTELIGENTE (TOLERANTE A TEXTO) - C9
// ==========================================
document.getElementById('cargar-archivo').addEventListener('change', function(e) {
    const archivo = e.target.files[0];
    if (archivo) {
        document.getElementById('nombre-archivo-seleccionado').innerText = `Archivo listo: ${archivo.name}`;
        
        const lector = new FileReader();
        lector.onload = function(evento) {
            const contenidoTexto = evento.target.result;
            
            // Separar el archivo por filas y por delimitadores de columna (, ; tab)
            let filas = contenidoTexto.split(/\r?\n/);
            let numerosExtraidos = [];

            filas.forEach(fila => {
                let columnas = fila.split(/[,;\t]+/);
                columnas.forEach(celda => {
                    let valorLimpio = celda.trim();
                    let numero = parseFloat(valorLimpio);
                    
                    // Filtrar para asegurarse de que es un número real y no texto explicativo
                    if (!isNaN(numero) && isFinite(numero)) {
                        numerosExtraidos.push(numero);
                    }
                });
            });

            datosCargadosGlobal = numerosExtraidos;
            console.log(`Filtro Inteligente: Se ignoraron textos y se extrajeron ${datosCargadosGlobal.length} valores numéricos.`);
        };
        lector.readAsText(archivo);
    }
});

function ejecutarModeladoC9() {
    const modeloElegido = document.getElementById('selector-fit').value;
    let datos = [...datosCargadosGlobal];

    // Datos por defecto (Muestra control de estabilidad si se pulsa el botón vacío)
    if (datos.length === 0) {
        datos = [10.2, 9.8, 11.5, 8.7, 10.1, 12.3, 9.4, 10.6, 11.1, 8.9, 10.0, 10.3, 9.7, 11.8, 9.1, 10.5, 11.0, 9.9];
    }

    datos.sort((x, y) => x - y);
    const n = datos.length;
    const min = datos[0];
    const max = datos[n - 1];

    let paramTexto = `• <strong>Datos numéricos válidos detectados (N):</strong> ${n}<br>`;
    let puntosEvaluacionX = [];
    let curvaTeoricaY = [];

    if (modeloElegido === 'uniforme') {
        const a_est = min; const b_est = max;
        paramTexto += `• Límite inferior (a): ${a_est.toFixed(4)}<br>• Límite superior (b): ${b_est.toFixed(4)}`;
        puntosEvaluacionX = [a_est - 1, a_est, a_est, b_est, b_est, b_est + 1];
        curvaTeoricaY = [0, 0, pdfUniforme(a_est, a_est, b_est), pdfUniforme(b_est, a_est, b_est), 0, 0];

    } else if (modeloElegido === 'normal') {
        const mu_est = datos.reduce((s, v) => s + v, 0) / n;
        const varianza = datos.reduce((s, v) => s + Math.pow(v - mu_est, 2), 0) / (n - 1);
        const sigma_est = Math.sqrt(varianza);
        
        paramTexto += `• Media Calculada (μ): ${mu_est.toFixed(4)}<br>• Desviación Estándar (σ): ${sigma_est.toFixed(4)}`;

        const inicioRango = mu_est - 3.5 * sigma_est;
        const finRango = mu_est + 3.5 * sigma_est;
        const iters = 80; const pasoNormal = (finRango - inicioRango) / iters;

        for (let i = 0; i <= iters; i++) {
            let evalX = inicioRango + (i * pasoNormal);
            puntosEvaluacionX.push(evalX);
            curvaTeoricaY.push(pdfNormal(evalX, mu_est, sigma_est));
        }

    } else if (modeloElegido === 'triangular') {
        const a_est = min; const b_est = max;
        const c_est = datos[Math.floor(n / 2)];
        paramTexto += `• Mínimo (a): ${a_est.toFixed(4)}<br>• Máximo (b): ${b_est.toFixed(4)}<br>• Moda Estimada (c): ${c_est.toFixed(4)}`;
        puntosEvaluacionX = [a_est - 0.5, a_est, c_est, b_est, b_est + 0.5];
        curvaTeoricaY = [0, 0, pdfTriangular(c_est, a_est, b_est, c_est), 0, 0];
    }

    document.getElementById('valores-estimados').innerHTML = paramTexto;
    document.getElementById('panel-parametros-estimados').style.display = 'block';

    // Construcción del histograma de frecuencias relativas ajustadas por densidad de área
    const numBins = 8;
    const anchoBin = (max - min) / numBins;
    const conteosBins = new Array(numBins).fill(0);
    const etiquetasBins = [];

    datos.forEach(valor => {
        let indiceBin = Math.floor((valor - min) / anchoBin);
        if (indiceBin >= numBins) indiceBin = numBins - 1;
        conteosBins[indiceBin]++;
    });

    const densidadesEmpiricas = conteosBins.map(conteo => conteo / (n * anchoBin));

    for (let i = 0; i < numBins; i++) {
        let centroBin = min + (i * anchoBin) + (anchoBin / 2);
        etiquetasBins.push(centroBin.toFixed(2));
    }

    if (miGraficoC9) miGraficoC9.destroy();
    const ctx9 = document.getElementById('graficoHistograma').getContext('2d');
    miGraficoC9 = new Chart(ctx9, {
        type: 'bar',
        data: {
            labels: etiquetasBins,
            datasets: [
                {
                    label: 'Densidad Empírica (Histograma)',
                    data: densidadesEmpiricas,
                    backgroundColor: 'rgba(13, 148, 136, 0.4)',
                    borderColor: '#0f766e',
                    borderWidth: 1,
                    barPercentage: 1.0, categoryPercentage: 1.0
                },
                {
                    label: 'Modelo Continuo Ajustado (PDF)',
                    data: curvaTeoricaY,
                    type: 'line',
                    borderColor: '#b91c1c', borderWidth: 3, pointRadius: 0, fill: false,
                    parsing: false, xAxisID: 'x2'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Intervalos de la Variable (Centros)' } },
                x2: { type: 'linear', min: puntosEvaluacionX[0], max: puntosEvaluacionX[puntosEvaluacionX.length - 1], display: false },
                y: { title: { display: true, text: 'Densidad f(x)' }, beginAtZero: true }
            }
        }
    });

    document.getElementById('interpretacion-texto').innerText = 
        `El sistema procesó satisfactoriamente los ${n} datos del archivo masivo. La curva roja te permite evaluar estadísticamente si el comportamiento real converge de forma consistente con el modelo probabilístico continuo ${modeloElegido.toUpperCase()}.`;
}

document.getElementById('btn-ajustar').addEventListener('click', ejecutarModeladoC9);
window.onload = function() { actualizarSimulacionC8(); };