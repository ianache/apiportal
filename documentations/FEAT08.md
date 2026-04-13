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

# Iterations

## Iteration #1 - Crear Organización
- Se debe permitir al seleccionar el icono del lapiz editar la organizacion. Debe aparecer un modal con los campos de la organizacion (nombre, descripcion, etc) y un boton para guardar los cambios ("Save") y otro para cancelar ("Cancel").
- Los campos deben ser editables y deben estar validados (nombre y descripcion no pueden estar vacios).
- Al guardar los cambios, se debe actualizar la organizacion en la base de datos y cerrar el modal.
- Al cancelar, se debe cerrar el modal sin guardar los cambios.
- Considerar variación al modelo conceptual en @documentations/apiportal.drawio en hoja "" incorporando los nuevos conceptos añadidos, las asociaciones y atributos definidos a los conceptos. Ahora la organizacion considerar a un "owner" que debe ser un usuario disponible desde Keycloak al que se le asignará la organización como "owner" (solo un usuario con responsabilidad owner por organizacion).
- En el Card en el "Banner de estado" se debe mostrar siempre quien es el Owner de la organización y en caso de aun no tener uno asignado se mostrará ("Unassigned")

## Iteration #2 - Asignar Owner
- El bff debe exponer un endpoint para obtener los usuarios disponibles en Keycloak.
- El selector del Owner en "Edit Organization" debe ser un combobox con un input de entrada que realice una busqueda del usuario dentro de la lista de usuarios disponible provistos por Keycloak. Este input debe ir filtrando los usuarios en la medida que se va completando el nombre y debe ser una lista ordenada alfabeticamente de forma ascendente.

## Iteracion #3 - Registrar Productos

- Al seleccionar "Products" debe abrir una nueva pagina hija donde se muestren todos los productos registrados por la organizacion. Esta pagina debe tener un boton para agregar un nuevo producto.
- El botón "Agregar Producto" debe abrir un modal con los campos del producto (nombre, descripcion, etc) y un boton para guardar los cambios ("Save") y otro para cancelar ("Cancel").
- Los campos deben ser editables y deben estar validados (nombre y descripcion no pueden estar vacios).
- Al guardar los cambios, se debe actualizar el producto en la base de datos y cerrar el modal.
- Al cancelar, se debe cerrar el modal sin guardar los cambios.
- Solo el owner de la organización puede agregar productos o usuario con roles "API Manager" tendran activa esta opcion.

## Iteration #4 - Product Diagram
- Se debe abrir una nueva pagina con un diseñador visual (canvas) para el producto. Este diseñador debe permitir crear, editar y eliminar nodos y relaciones (asociaciones) entre ellos. 
- Los nodos representaran SWCI (SoftwareConfigurationItem) en los que se estructura la arquitectura del producto y las relaciones representaran las dependencias entre ellos. 
- Al guardar los cambios (un icono representativo para Save en el banner superior del diseñador visual o canvas), se debe actualizar el producto y su arquitectura en la base de datos.
- El diseñador debe permitir arrastrar los nodos que figuraran en una lista mostrada en panel izquierdo del diseñador y soltar sobre el canvas para crear una instancia de ese nodo en el canvas. El nodo debe mostrar un icono representativo de su tipo (API, Base de Datos, Microservicio, etc.) a la izquierda y el nombre del SWCI a la derecha. 
- Los nodos visuales deben tener un pequeño circulo (punto de conexion) en el centro de cada borde para permitir agregar una relacion.
- Al realizar un drag de un punto de conexion de un nodo y soltarlo sobre un punto de conexion de otro nodo se debe crear una relacion entre ellos. 
- Al seleccionar un nodo en el canvas a la derecha se activará un panel de propiedades donde se podrá editar el nombre del SWCI, su descripcion y el tipo (segun la lista de SoftwareConfigurationType).
- Al seleccionar la relacionentre dos nodos se debe activar un panel de propiedades donde se podrá editar el tipo de relacion (segun la lista de SoftwareConfigurationDependencyType). 
- El nodo seleccionado se puede eliminar arrastrandolo fuera del canvas o presionando la tecla "Suprimir" o "Delete".
- La relacion seleccionada se puede eliminar arrastrandolo fuera del canvas o presionando la tecla "Suprimir" o "Delete".
- El nodo seleccionado se debe mostrar con un borde de color azul y un pequeño icono de una cruz a la derecha del nombre para eliminarlo.
- La relacion seleccionada se debe mostrar con un borde de color azul y un pequeño icono de una cruz a la derecha del nombre para eliminarlo.
- El nodo seleccionado se puede arrastrar y soltar sobre el canvas para cambiar su posicion.
- La relacion debe mostrar una flecha en el extremo del nodo destino para indicar la direccion de la relacion.
- La relacion debe mostrar en un tooltip el tipo de relacion al pasar el mouse sobre ella.
- El nodo seleccionado se puede arrastrar y soltar sobre el canvas para cambiar su posicion.
- Los nodos son objetos visuales que tienen una referencia al SWCI en la base de datos, permitiendo que un mismo SCWI pueda ser visualizado en diferentes productos. Por lo tanto, al editar un nodo se debe editar el SWCI en la base de datos. Sin embargo, al eliminar un nodo se debe eliminar la relacion entre el SWCI y el producto, no el SWCI en la base de datos.

## Iteration #5 - SWCI Node
- Se ha actualizado @documentations/apiportal.drawio en hoja "architecture_swci" incorporando los nuevos conceptos añadidos (PropertySpecification y Property), las asociaciones y atributos definidos a los conceptos.
- Cuando el Node para el SWCI sea de tipo API o Microservice se debe seleccionar de la lista de API disponibles cual es el API al que hace referencia el nodo. Este SWCI debe estar asociado a una version de API (API Version) y debe estar asociado a un tipo de SWCI (SoftwareConfigurationType) que debe ser API o Microservice.
- Los ConfigurationItemType cuentan con una lista de atributos asociados que deben ser mostrados en el panel de propiedades del nodo. Por lo tanto, al seleccionar un nodo se debe mostrar en el panel de propiedades del nodo los atributos asociados al tipo de SWCI seleccionado con el valor correspondiente segun el tipo de datos de la propiedad. Por ejemplo, si el tipo de SWCI es API y tiene asociado un atributo de tipo "string" se debe mostrar un input de tipo texto para editar el valor del atributo. Si el tipo de SWCI es API y tiene asociado un atributo de tipo "integer" se debe mostrar un input de tipo numero para editar el valor del atributo. Si el tipo de SWCI es API y tiene asociado un atributo de tipo "boolean" se debe mostrar un input de tipo checkbox para editar el valor del atributo.

## Iteration #6 - SWCI Node Connection

- No me está permitiendo usar el punto de conexion de la derecha como origen para relacionar un nodo con otro nodo del diagrama por cualquier de los 4 puntos de conexion. Todo punto de conexion debe poder ser source y target sin limitación. El sentido de la relacion (flecha) es del punto de conexion desde el que se hace el drag hasta el punto de conexion donde se realiza el drop.

- Fix: cuando hago drag del punto de conexion del borde inferior de un nodo (source) y drop sobre el punto de conexion del borde superior de un nodo (target) el sentido de la flecha sale invertido. El sentido de la fecla siempre tiene que estar orientada de souce a target y por ende la cabeza de la flecha siempre debe pintarse en el extremo del target en la relacion/conexion.

## Iteracion #7 - SWCI Types and Toolbar Organization

- Las herramientas/componentes SWCI que se colocan en el panel izquierdo deben estar organizados por tipo de SWCI y dentro de cada tipo de SWCI debe estar ordenado alfabeticamente por nombre. Por ejemplo, si hay 3 tipos de SWCI (API, Base de Datos, Microservicio) deben estar ordenados alfabeticamente y dentro de cada tipo de SWCI debe estar ordenado alfabeticamente por nombre.
- El agrupamiento de las herramientas/componentes SWCI debe ser un marco con un titulo que indique el tipo de SWCI y dentro del marco deben estar las herramientas/componentes SWCI ordenados alfabeticamente por nombre. Alineado a la izquierda el nombre del Tipo de SWCI y a la derecha un icono para expandir/contraer el agrupamiento. Por defecto el agrupamiento debe estar contraido.
- Añadir al panel flotando del canvas debajo el icono del candado para "block" otro icono "snap" que permita activar/desactivar el snap a la grilla. Por defecto el snap debe estar activado.

## Iteration #8 - Save On Exit
- Necesitamos un componente reutilizable para Confirmar o Rechazar acciones. Este componente debe tener dos botones, uno para confirmar y otro para rechazar. El boton de confirmar debe tener un color verde y el boton de rechazar debe tener un color rojo. El componente debe recibir como parametros el titulo del mensaje, el mensaje y el texto de los botones. Por defecto el boton de confirmar debe estar seleccionado y el boton de rechazar debe estar deseleccionado.
- Cuando se sale del diseñador visual del producto (cerrando la pestaña o navegando a otra pagina) se debe guardar el producto y su arquitectura en la base de datos. Por lo tanto, al salir del diseñador visual del producto se debe guardar el producto y su arquitectura en la base de datos y cerrar el diseñador visual del producto.
- Se debe informar al usuario si existen cambios sin guardar al intentar salir del diseñador visual del producto y se debe preguntar si desea guardar los cambios. Si el usuario confirma se debe guardar el producto y su arquitectura en la base de datos y cerrar el diseñador visual del producto. Si el usuario cancela se debe cerrar el diseñador visual del producto sin guardar los cambios.
- Utilizar el componente reutilizable de confirmacion para confirmar o rechazar la accion de guardar el producto y su arquitectura en la base de datos.

## Iteracion #9 - Cards summary

- En el Card de Organizacion en "Associated APIs" se debe indicar "Products" y el contador debe ser la cantidad de productos definidos en la organizacion.
- En el Card del Producto debajo de "Configuration Items" debe figurar el contedo por de numero de SWCI por tipo incluyendo el valor del contador y a su derecha el icono representativo de cada tipo.
- Necesito que se añada un SWCI Type adicional para "App Mobile" con atributos tal como Tipo (Android o iOS)

## Iteracion #10 - Data Transformation Managment

- Se debe tomar como base "API Explorer" y generar un componente reutilizable que tenga un panel superior separado en dos parters: a la izquierda sun subpanel con un titulo resaltado (por ejemplo "Data Transformation"), debajo una descripcion de la pagina, y otro subpanel a la derecha para colocar botones de accion (por ejemplo "Save", "Cancel", etc.). Debajo de este panel un cuerpo donde debe ir el contenido específico cuando se reutilice este componente.
- Analizar el modelo conceptual en @documentations/apiportal.drawio en la pagina "transformation".
- Se debe añadir una nueva opción al menú principal lateral "Data Transformations" que debe estar debajo de "Integrations" y debe tener un icono representativo.
- Utilizar el componente reutilizable para crear la nueva página de gestión de "Data Transformation" que tendrá por titulo "Data Transformation" y descripcion "Gestión de las transformaciones de datos requeridas para las Integraciones". En el subpanel de comando debe tener los botones "New Transformation" y a su izquierda dos botones para cambiar la forma de visualización del contenido (tabla o tarjetas). 
- El cuerpo de la pagina debe mostrar un listado de las transformaciones de datos requeridas para las Integraciones en formato tabla con las columnas: "Name", "Description", "Source" (nombre de la fuente), "Target" (nombre del target), "Actions" ("Open", "Delete").
- El cuerpo de la pagina debe mostrar (cuando se seleccione la opcion "Cards") un listado de las transformaciones de datos requeridas para las Integraciones en formato tarjetas (usando el componente reutilizable para CardTemplate) con la siguiente informacion: "Name", "Description", "Source" (nombre de la fuente), "Target" (nombre del target), "Actions" ("Open", "Delete").

## Iteracion #11 - Plantilla de Busquedas

- Utilizar como base la imagen siguiente @documentations/images/plantilla_panel_busqueda.png para generar un componente reutilizable SearchTemplate.vue. En la parte superior y a la izquierda del boton "Search" se tiene la sección de los campos de busqueda. Debajo de la linea divisoria aparecerán campo y valor ingresado y a la derecha "x Clear All" (el icono de la x debe ser un icono de cerrar/eliminar).
- El componente reutilizable SearchTemplate.vue debe tener los siguientes parametros: 
    - fields: array de objetos con los campos de busqueda. Cada objeto debe tener las propiedades: "name", "label", "type", "value", "placeholder", "required", "disabled", "readonly", "options", "rules", "events", "attributes", "style", "class", "slot", "scopedSlots"
    - search: funcion que se ejecuta cuando se hace click en el boton "Search". Esta funcion debe recibir como parametro un objeto con los valores de los campos de busqueda.
    - clear: funcion que se ejecuta cuando se hace click en el boton "Clear All". Esta funcion debe limpiar todos los campos de busqueda.

- Utilizar el componente reutilizable SearchTemplate.vue para generar el componente de busqueda de "Data Transformation" considerando como campos para la busqueda los siguientes: "Name", "Description", "Source" (nombre de la fuente), "Target" (nombre del target). 

## Iteracion #12 - Editor de Transformacion

- Al seleccionar "New Transformation" se debe abrir un modal que permita crear una nueva transformacion. Este modal debe tener los siguientes campos: "Name", "Description", Organization (de las organizaciones disponibles) y Domain (de los dominios disponibles). 
- El Card de la transformacion (usar el CardTemplate.vuew) debe tener un boton "Edit" que permita editar la transformacion. Debe abrirse un editor de transformación con una página independiente alineada al diseño visual en @documentations\images\data_transformation_designer.png
- A la izquierda del editor se debe tener un panel con herramientas desde la que se pueden arrastrar y soltar elementos en el editor en la zona central "Tx Area" (que es el área de transformación) 

## Iteracion #13 - Schema Load

- Necesito poder cargar un documento con un "JSON Schema specification" en "Input Structure" y en "Output Structure" se debe parsear y generar la estructura a visualizar en ambos casos.
- En la barra flotante de tareas en el canvas debe aparecer el icono (emogi) de cada "Tx Node Type". La barra de herramientas debe poder reposicionarse haciendo drag and drop. Ajustar "Settings > Tx Node Type" para que en cada "parameter" se pueda indicar si es "input" (visualmente se asocia con un punto de conexion en el nodo en el diagrama del Canvas) o "variable" (no visible como punto de conexión) permitiendo en el Editor de Propiedades proporcionar su valor.
- En el panel de Properties para nodos de transformacion separar la edicion de las propiedades de tipo "input" (mostrar sin posibilidad de edicion del campo source vinculado a la propiedad) de las propiedades de tipo "variable" que son editables.