require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PRESUPUESTO_MAP = {
  bajo: 'bajo (ingredientes económicos y accesibles, sin productos caros)',
  medio: 'medio (ingredientes de buena calidad con precio razonable)',
  alto: 'alto (ingredientes premium, productos gourmet y de temporada)',
};

const COCINA_MAP = {
  mediterranea: 'mediterránea (aceite de oliva, legumbres, verduras, pescado, pasta)',
  asiatica: 'asiática (arroz, salsa de soja, jengibre, tofu, wok, especias orientales)',
  internacional: 'internacional (fusión de estilos, platos de distintas culturas del mundo)',
  variada: 'variada (mezcla equilibrada de todos los estilos culinarios)',
};

const PERFIL_PROMPTS = {
  estudiante: () => `
PERFIL DEL USUARIO: Estudiante universitario con poca experiencia cocinando
- Recetas MUY SENCILLAS: máximo 4-5 ingredientes por plato
- Solo técnicas básicas: hervir, freír en sartén, horno a temperatura fija, microondas
- Tiempo de preparación máximo 30 minutos por plato
- Ingredientes fáciles de encontrar en cualquier supermercado
- Platos económicos, rendidores y fáciles de llevar en táper`,

  deportista: ({ calorias, alimentosEvitar }) => `
PERFIL DEL USUARIO: Deportista con objetivos calóricos específicos
- Calorías diarias OBJETIVO: ${calorias || 2500} kcal
- Distribución calórica: Desayuno ~20%, Almuerzo ~10%, Comida ~35%, Merienda ~15%, Cena ~20%
- Alto en proteínas de calidad (pollo, huevo, legumbres, atún, pavo, queso cottage)
- Carbohidratos complejos (avena, arroz integral, pasta, boniato, pan integral)
- Grasas saludables (aguacate, frutos secos, aceite de oliva, salmón)
${alimentosEvitar ? `- Alimentos a EVITAR ESTRICTAMENTE: ${alimentosEvitar}` : ''}
- Menú diseñado para rendimiento deportivo y recuperación muscular`,

  mayor: () => `
PERFIL DEL USUARIO: Persona mayor con necesidades dietéticas específicas
- Recetas de fácil digestión y masticación (sin alimentos muy duros o crudos en exceso)
- Rico en calcio, vitamina D, potasio, fibra y antioxidantes
- Sin picante ni condimentos fuertes
- Porciones moderadas y equilibradas
- Preparaciones tradicionales: cocidos, estofados, al horno, a la plancha
- Evitar frituras abundantes y ultraprocesados
- Priorizar verduras cocinadas, legumbres, pescado y lácteos`,

  trabajador: ({ tiempoMax }) => `
PERFIL DEL USUARIO: Persona con muy poco tiempo para cocinar
- Tiempo MÁXIMO de preparación por plato: ${tiempoMax || 30} minutos
- Priorizar recetas de un solo recipiente (olla, sartén, bandeja de horno)
- Platos que se puedan preparar con antelación (batch cooking) y duran varios días
- Ingredientes que se compran una vez a la semana y se conservan bien
- Platos que se puedan calentar en microondas o comer fríos
- Nutritivos, energéticos y saciantes a pesar de su sencillez`,
};

app.post('/api/generate-menu', async (req, res) => {
  const { personas, restricciones, presupuesto, cocina, preferenciasExtra,
          perfil, calorias, alimentosEvitar, tiempoMax } = req.body;

  if (!personas || !presupuesto || !cocina) {
    return res.status(400).json({ error: 'Faltan datos obligatorios.' });
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-tu-clave-aqui') {
    return res.status(500).json({ error: 'Configura tu OPENAI_API_KEY en el archivo .env' });
  }

  const restriccionesText =
    restricciones && restricciones.length > 0
      ? restricciones.join(', ')
      : 'ninguna';

  const perfilText = perfil && perfil !== 'ninguno' && PERFIL_PROMPTS[perfil]
    ? PERFIL_PROMPTS[perfil]({ calorias, alimentosEvitar, tiempoMax })
    : '';

  const prompt = `Eres un chef y nutricionista experto. Genera un menú semanal completo y detallado.

PARÁMETROS:
- Número de personas: ${personas}
- Restricciones alimentarias: ${restriccionesText}
- Presupuesto: ${PRESUPUESTO_MAP[presupuesto] || presupuesto}
- Tipo de cocina: ${COCINA_MAP[cocina] || cocina}
${preferenciasExtra ? `- Requisitos adicionales: ${preferenciasExtra}` : ''}
${perfilText}
INSTRUCCIONES:
- Genera exactamente 7 días (Lunes a Domingo)
- Cada día debe incluir: desayuno, almuerzo, comida, merienda y cena
- Sé específico: nombra cada plato e indica los ingredientes principales
- Los platos deben ser variados a lo largo de la semana (no repetir el mismo plato)
- Respeta ESTRICTAMENTE todas las restricciones alimentarias indicadas
- Adapta las porciones y cantidades al número de personas
${perfilText ? '- Cumple OBLIGATORIAMENTE todas las indicaciones del perfil del usuario' : ''}
${preferenciasExtra ? `- Cumple OBLIGATORIAMENTE los requisitos adicionales: ${preferenciasExtra}` : ''}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta (sin texto adicional):
{
  "dias": [
    {
      "dia": "Lunes",
      "desayuno": "descripción completa del desayuno",
      "almuerzo": "descripción completa del almuerzo",
      "comida": "descripción completa de la comida",
      "merienda": "descripción completa de la merienda",
      "cena": "descripción completa de la cena"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.85,
      max_tokens: 3000,
    });

    const raw = completion.choices[0].message.content;
    const menuData = JSON.parse(raw);

    if (!menuData.dias || !Array.isArray(menuData.dias)) {
      throw new Error('Formato de respuesta inesperado');
    }

    res.json(menuData);
  } catch (err) {
    console.error('Error OpenAI:', err.message);
    const message =
      err.status === 401
        ? 'API key de OpenAI inválida. Revisa tu archivo .env'
        : err.status === 429
        ? 'Límite de uso de OpenAI alcanzado. Inténtalo más tarde.'
        : 'Error al generar el menú. Por favor, inténtalo de nuevo.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/meal-details', async (req, res) => {
  const { meal, type, label, day, personas } = req.body;

  if (!meal) return res.status(400).json({ error: 'Plato no especificado.' });

  const prompt = `Eres un chef y nutricionista experto. Proporciona información detallada sobre el siguiente plato.

PLATO: ${meal}
TIPO DE COMIDA: ${label || type}
DÍA: ${day || ''}
PARA: ${personas || 1} persona(s)

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "tiempo_preparacion": "X minutos",
  "calorias_por_persona": 000,
  "coste_total_estimado": "X.XX€",
  "ingredientes": [
    { "nombre": "Nombre del ingrediente", "cantidad": "cantidad total para ${personas || 1} persona(s)", "precio_aprox": "X.XX€" }
  ],
  "pasos": [
    "Paso detallado 1",
    "Paso detallado 2"
  ]
}

REQUISITOS:
- Los precios deben ser realistas en euros (€) para España en 2025
- Las calorías deben ser aproximadas y realistas (solo el número, sin unidades)
- Incluye entre 5 y 8 pasos de preparación, concisos pero completos
- Lista todos los ingredientes con cantidades para ${personas || 1} persona(s)
- El campo "coste_total_estimado" es el sumatorio aproximado de todos los ingredientes`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1200,
    });

    const data = JSON.parse(completion.choices[0].message.content);
    res.json(data);
  } catch (err) {
    console.error('Error meal-details:', err.message);
    res.status(500).json({ error: 'Error al obtener los detalles del plato. Inténtalo de nuevo.' });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor listo en http://localhost:${PORT}\n`);
});
