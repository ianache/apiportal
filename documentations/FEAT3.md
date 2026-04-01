# Feature 3: Diseñador de Integrations

# Requerimientos

- Cuando se seleccione un Integracion debe abrirse un Diseñador de Integrations similar al Diseñador de API, pero permitiendo crear un flujo de integracion basado en patron Pipe&Filter donde los Filters son nodos que implementan "tipos de nodos (nombre, descripcion, id de la forma 'nombre@v1" y tienen definido un conjunto de propiedades que deben ser seteadas) en cada nodo que se coloque en el integration. 
- Los nodos en el integration se unen por pipe (conexiones) conectando un pequeño circulo en el borde del nodo origen con el pequeño circulo en el borde dle nodo destino. 
- Una integracion inicia con un nodo que define el protocolo del mensaje recibido por la integracion (siempre debe existir un nodo de inicio) y este nodo se conecta a un nodo (flujos) dividido en 3 subflujos (incoming, response y exception). 
- Sobre los sbflujos se pueden drag & drop nodos (filter) simples a partir del catalogo de tipos de nodos pudiendo conectarse entre ellos para formar una secuencia. 
- Al seleccionar estos nodos se debe mostrar un panel de configuracion del nodo donde se ingresar los valores de las propiedades según el "tipo del nodo".
- El diseñador debe tener una paleta  flotando con cada tipo de nodo como herramientas que se arrastran y sueltan sobre el lienzo de diseño o sobre los subflujos.