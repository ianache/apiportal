# Feature 07: Product and SWCI Architecture

## Description

- Tomar como base el archivo drawio (documentations\apiportal.drawio) para solo la pagina (architecture_swci) donde se encuentra modelo conceptual basado en UML.
- Añadir una submenu al menu principal llamada "Organization" donde el usuario puede gestionar las organizaciones a las que pertenece.
- Añadir una opción debajo de Organizacion que permit gestionar todas las organizaciones usando como base el patrón ya usado en "Explorer" desde donde se puede gestionar las "API" para asegurar la consistencia de la interfaz de usuario. Desde esa pagina se podrá realizar las busqueda (se espera no sean muchas las organizaciones)
- Generar un componente reutilizable para un Card (template) tomando como base el Card de APIs con zona superior de cabecera, cuerpo donde se colocará el contenido específico cuando se reutilice ese Card template, una sección informativa debajo del cuerpo que será el espacio para colocar elementos como labels y otra sección inferior donde colocaremos acciones.
- Reutilizar esa plantilla de Card para crear el Card de "Organization" donde en la cabecera mostraremos el nombre y descripcion (recortar para que no exceda el espacio de 200 caracteres, terminando con "..." y un hover que muestre todo el detalle)
- En la sección informativa mostraremos el identificador de la organización y el número de APIs que tiene asociadas.
- En la sección de acciones mostraremos un botón para editar la organización (debe llevarnos a otra pagina hija donde se edita todo el contenido de la organizacion)
- En la sección de acciones mostraremos un botón para registrar los "Product" de la organizacion según el Modelo Conceptual.