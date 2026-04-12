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