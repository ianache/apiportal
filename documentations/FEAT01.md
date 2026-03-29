# Feature: Restfull API Design

Goal: Design Restfull HTTP/JSON APIs with a modern visual design approach and fully aligned with OpenAPI specification.

# User Stories:

- As an API designer I want to get access to the API design studio (Main Menu -> Projects) to design new APIs.
  * A search bar to search for APIs.
  * A list of APIs showing each API with the following information:
    * Name
    * Version
    * Description
    * Status
    * Created Date
    * Updated Date
  * A button to create a new API.
  * A button to import an API (from OpenAPI/Swagger standard specification).
  * In API card header a title to the left and actions buttons to the right to edit, change from draft to published, delete icons.
- As an API design i want to design a selected (click on edit icon) API to open the API design studio. The API design studio is a visual interface to design APIs. It has the following features:
  * A canvas to design the API.
  * A palette of nodes to add to the canvas.
  * A properties panel to configure the selected node.
  * A toolbar to save, undo, redo, and validate the API design.
  * A status bar to show the status of the API design.