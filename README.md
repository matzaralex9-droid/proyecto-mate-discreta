# Nodo — Laboratorio de matemática discreta

Aplicación web en español para explorar árboles binarios y grafos ponderados. Proyecto completo en React, TypeScript y Vite, con animaciones SVG mediante Motion. Las fuentes están incluidas localmente: no necesita Google Fonts ni servicios externos para funcionar después de instalar las dependencias.

## Ejecutar

En macOS, abre `iniciar.command` desde esta carpeta. Se abrirá el navegador; mantén abierta la ventana de terminal. El lanzador utiliza el Node instalado o el runtime local de Codex si el primero no funciona.

En cualquier sistema con Node.js 22.12 o superior:

```sh
npm install
npm run dev
```

Abre la dirección que muestra la terminal, normalmente http://127.0.0.1:5173. Para detenerlo, pulsa Ctrl+C. Si el puerto está ocupado, Vite elige el siguiente y lo indica.

```sh
npm test       # Pruebas de algoritmos e importación
npm run build # Verificación TypeScript y compilación para producción
npm run preview # Visualizar la compilación de producción
```

## Lo que puedes hacer

### Laboratorio de árboles

- Insertar registros con clave única (0–999) y nombre.
- Buscar y eliminar mostrando las comparaciones desde la raíz; los cambios se aplican al final de la animación. Cambiar de laboratorio antes de finalizar cancela la operación pendiente.
- Editar el nombre al seleccionar un nodo y pulsar el lápiz.
- Recorrer en preorden, inorden o posorden, y comparar los tres simultáneamente.
- Usar un árbol binario de búsqueda o un AVL con rotaciones reales al insertar y eliminar.
- Consultar una tabla de registros y relaciones padre/hijos, altura en aristas y número de hojas.
- Cargar un árbol equilibrado, inclinado o un directorio de personas.

### Laboratorio de grafos

- Añadir nodos con el formulario o haciendo clic en el lienzo con la herramienta +.
- Arrastrar nodos; también se pueden enfocar con Tab y mover con las flechas del teclado.
- Conectar nodos desde el formulario o seleccionar dos con la herramienta Conectar; elegir el peso y confirmar.
- Editar nombres y pesos al seleccionar nodos o aristas; eliminar conexiones o nodos con todas sus conexiones.
- Usar grafos dirigidos o no dirigidos. Al quitar dirección se conserva la primera conexión de cada par; el cambio se puede deshacer.
- Resolver rutas con Dijkstra, ver la exploración y actualización de distancias, y resaltar la ruta óptima.
- Explorar un campus (distancias), una red social (cada amistad vale 1) o una red de routers (costos).
- En routers, convertir ancho de banda a costo con la fórmula didáctica `1000 / Mbps`. Es una simplificación inspirada en OSPF, no una emulación de su implementación ni configuración real.

### Controles comunes

Reproducir, pausar, avanzar, retroceder, cambiar velocidad, saltar al resultado o desplazarse por la línea de tiempo. Espacio controla la reproducción cuando el foco no está en un botón o campo. Los diálogos usan el manejo de foco nativo y admiten Escape. Las preferencias de movimiento reducido se respetan.

Los cambios se guardan en `localStorage` del navegador. No hay servidor de base de datos: la base de datos de registros es una simulación local basada en el árbol. Exportar e importar proyectos JSON incluye ambos laboratorios. El historial de Deshacer conserva las últimas 30 ediciones de la sesión (no sobrevive a una recarga).

## Decisiones y límites

- Hasta 31 registros por árbol y 20 nodos por grafo, para mantener el lienzo comprensible. En árboles muy profundos usa el zoom y la tabla de registros.
- Dijkstra admite pesos no negativos, incluidos cero y decimales (máximo 9999), y detecta destinos inalcanzables. Se detiene al confirmar el destino; las otras distancias sin ✓ pueden ser provisionales.
- No se permiten claves de árbol duplicadas, autoaristas ni conexiones repetidas en la misma dirección. Los grafos dirigidos permiten conexiones recíprocas.
- La importación comprueba formato, tamaño, límites, orden del árbol, balance AVL, nodos y pesos.
- La búsqueda y eliminación en BST tienen costo O(h), AVL O(log n); los recorridos O(n). Dijkstra usa una selección ordenada de candidatos y escanea aristas por nodo, adecuada al límite pequeño del laboratorio; no utiliza un heap.

## Estructura

- `src/lib/algorithms.ts`: árboles, rotaciones, recorridos, Dijkstra, ejemplos y validación.
- `src/lib/algorithms.test.ts`: pruebas, incluyendo comparación independiente de Dijkstra con Floyd-Warshall en 720 pares origen/destino.
- `src/components/TreeLab.tsx` y `TreeCanvas.tsx`: gestión y visualización del árbol.
- `src/components/GraphLab.tsx` y `GraphCanvas.tsx`: editor y simulación de grafos.
- `src/components/shared.tsx`: reproducción, diálogos y controles.
- `src/App.tsx`: navegación, historial, guardado e importación/exportación.
- `src/styles.css`: interfaz adaptable para escritorio y móvil.

## Guion sugerido para presentar

1. En el directorio inicial, ejecuta Inorden y explica por qué los valores aparecen ordenados.
2. Activa la comparación y muestra cómo cambia la posición de la raíz en los tres recorridos.
3. Inserta 35 / Camila, búscala y elimínala, observando cada comparación.
4. Carga el árbol inclinado y conviértelo a AVL para ver su balanceo.
5. En Grafos, usa Campus → Estación. La ruta óptima es Campus → Cafetería → Museo → Estación, con peso 12.
6. Cambia un peso, recalcula y explica cómo puede cambiar la ruta.
7. Muestra un grafo dirigido o desconectado y el ejemplo de ancho de banda.

Documentación de herramientas: [Vite](https://vite.dev/guide/) y [Motion para SVG](https://motion.dev/docs/react-svg-animation).

## Fotografía del campus
Fondo: UVG Campus Altiplano, fotografía publicada por Actualidad UVG: https://noticias.uvg.edu.gt/uvg-campus-altiplano-impacta-guatemala/ . Archivo original conservado en public/uvg-altiplano.jpg.
