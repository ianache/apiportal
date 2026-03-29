# API Manager

el propósito principal de esta aplicación es tener un lugar centralizado para gestionar todas las apis que utilizo en mis proyectos, de manera que pueda tener un control total sobre ellas y pueda reutilizarlas en mis proyectos.

## Características

- Se debe poder gestionar usuarios bajo los roles de API Manager, API Designer y API Developers.
- El API Manager es el único que puede crear, editar y eliminar usuarios.
- El API Designer es el único que puede crear, editar y eliminar apis.
- El API Developer es el único que puede utilizar las apis.
- Las APIs diseñadas pasan por un proceso de aprobación por parte del API Manager.
- Las APIs aprobadas pasan por un proceso de publicación por parte del API Manager.
- Las APIs publicadas pasan por un proceso de consumo por parte del API Developer.
- Las APIs deben tener un sistema de versionado.
- Se debe considerar un tipo especial de API llamadas APIs de Integration que contiene un flujo de integración (incoming flow, response flow, exception flow) y que permite cada flow usando el patron pipe & filters que un mensaje que entra al Integration Flow fluya a travéz de varios nodos de procesamiento (inflow, repsonse o exception).
- Los nodos de procesamiento pueden ser de varios tipos, como por ejemplo:
    - Transformación de datos
    - Validación de datos
    - Enrutamiento de datos
- Los nodos se basan en componentes preconstruidos con propiedades específicas que se deben poder personalizar en sus valores. Por ejemplo, un nodo de transformación de datos puede tener propiedades como el "Schema JSON" contra el que se valida el payload.
- Los nodos se pueden conectar entre sí para formar un flujo de procesamiento.
- El nodo inicial de un flujo de integración siempre es obligatorio y puede ser de tipo HTTP, Kafka, etc.
- el nodo inicial de un flujo de integracion de tipo HTTP debe tener propiedades como el método HTTP (GET, POST, PUT, DELETE, etc.) y la ruta de la API.
- Se tiene otro nodo especial (finaliza siempre el integration flujo) que permite realizar el "route" hacia el endpoint del API registrada a ser consumido aplicando las politicas de seguridad correspondientes (son propiedades de este tipo de componente especial)
- El diseño de las APIs se debe realizar de forma visual, arrastrando y soltando elementos en un lienzo.
- Los nodos se basan en componentes preconstruidos y que se referencias por un nombre corto e internamente el API gateway que ejecuta cada integration flow y los nodos que lo integran mapean hacia una clase Java que implementa una interfaz abstracta (esto está fuera del alcance de este proyecto, solo se debe considerar el diseño de los nodos y sus propiedades)
- Se cuenta con un API en el API Gateway ya implementado que tiene los endpoints para crear, editar, eliminar y listar usuarios, apis, integration flows y nodos. La URL de documentación swagger es la siguiente: https://api.prod.comsatel.com.pe/gatewayesb/gatewayesb/api-docs/Gateway%20Admin