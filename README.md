# Ex3.js Refactor Notes - Decision Question Tree

## Refactor Summary for Assignment

For this assignment, I refactored my previous Decision Question Tree project. The original project already worked, but the JavaScript code had several maintainability problems that would make future changes harder and more expensive.

The main parts that needed to be refactored were:

1. The decision tree state was exposed directly through `treeManager.tree`.
   Reason: Other parts of the program could directly depend on or mutate the internal data structure.
   Refactor: I encapsulated the tree state inside `createTreeStore()` and exposed controlled public APIs such as `getNode`, `upsertNode`, `deleteNode`, and `getRelationships`.
   Benefit: This reduces coupling, controls mutation, and makes add/edit/delete behavior easier to debug and extend.

2. The navigation state was stored in global variables such as `currentQuestionId` and `historyStack`.
   Reason: Global mutable state makes it harder to know which part of the program changed the current question.
   Refactor: I moved navigation state into `createTreeNavigator()`.
   Benefit: The current node and back history now have a clear owner, making navigation bugs easier to trace.

3. The code used `innerHTML` to render dynamic data from the admin form.
   Reason: Rendering user/admin input with `innerHTML` can create security risks and mix markup with data.
   Refactor: I replaced dynamic `innerHTML` rendering with `createElement`, `textContent`, and `replaceChildren`.
   Benefit: Rendering is safer and easier to reason about.

4. The admin list used inline `onclick` handlers and attached custom functions to `window`.
   Reason: This creates unnecessary global coupling between HTML strings and JavaScript function names.
   Refactor: I replaced inline handlers with `addEventListener`.
   Benefit: Event ownership is clearer, and the code is easier to maintain.

5. Some functions mixed multiple responsibilities such as reading form data, validation, state mutation, and rendering.
   Reason: Large mixed-responsibility functions increase cognitive load and make debugging harder.
   Refactor: I separated the logic into smaller intention-revealing functions such as `buildNodeFromForm`, `renderCurrentQuestion`, `getMissingTargets`, `refreshAdminPanel`, and `handleDeleteNode`.
   Benefit: Each function has a clearer purpose, reducing debugging search space.


## Context

Exercise requirement:

Create a decision question tree where the answer of the previous question affects the next displayed question. The questionnaire must be easy to add, edit, or delete at low cost.

Constraint:

Only the JavaScript file is refactored. The existing HTML and CSS are kept unchanged.

## Main Refactor Goal

The main goal of this refactor is not only to make the app work. The goal is to make the JavaScript code easier to read, easier to debug, safer to change, and easier to extend later.

The refactor focuses on these engineering objectives:

- Use closure to encapsulate state.
- Hide internal implementation details behind public APIs.
- Avoid direct mutation of shared state from unrelated code.
- Use intention-revealing function names.
- Keep functions short and focused on one responsibility.
- Avoid inline onclick and avoid attaching custom handlers to window.
- Prefer textContent and DOM creation over innerHTML when rendering user/admin input.
- Separate tree state, navigation state, rendering logic, and admin form logic.

## What Was Wrong Before

The original JavaScript worked, but several parts made the code harder to maintain:

1. Tree state was exposed directly through `treeManager.tree`.

   This means UI logic and admin logic could read or depend on the internal data structure directly. If the internal structure changed later, many parts of the code would need to change.

2. Navigation state was global.

   `currentQuestionId` and `historyStack` were mutable variables outside a clear owner. This makes debugging harder because many functions can change them.

3. Rendering mixed safe DOM APIs with `innerHTML`.

   Rendering admin-controlled text with `innerHTML` can create security risk if user input is injected into the page. The refactor uses `textContent` and DOM creation for dynamic text.

4. Admin list actions used inline `onclick`.

   The original list created buttons like `onclick="handleEditClick(...)"` and exposed handlers on `window`. This increases coupling between HTML strings and global JavaScript functions. The refactor uses `addEventListener` instead.

5. Large functions had mixed responsibilities.

   Some functions handled validation, state mutation, rendering, and UI refresh together. The refactor separates these into smaller functions with clearer names.

## New Architecture

The refactored JavaScript is organized into clear boundaries.

### 1. Tree Store

Factory:

```js
const createTreeStore = (initialData = {}) => { ... };
```

Responsibility:

The tree store owns the decision tree data.

Private state:

```js
const tree = ...;
```

Public API:

```js
getNode(nodeId)
hasNode(nodeId)
getNodeIds()
getTreeSnapshot()
upsertNode(nodeId, nodeData)
deleteNode(nodeId)
getMissingTargets(nodeData, currentNodeId)
getRelationships()
```


- Other code cannot directly mutate `tree`.
- All tree changes go through controlled methods.
- Debugging is easier because mutation paths are limited.
- The internal storage can later change from object to Map, localStorage, API, or database with lower impact.

### 2. Tree Navigator

Factory:

```js
const createTreeNavigator = (startNodeId = START_NODE_ID) => { ... };
```

Responsibility:

The navigator owns the current node and back history.

Private state:

```js
let currentNodeId = startNodeId;
let historyStack = [];
```

Public API:

```js
getCurrentNodeId()
goToNode(nextNodeId)
goBack()
restart()
previewNode(nodeId)
restartIfViewing(nodeId)
```

- Navigation state is no longer global.
- Button behavior is easier to test and reason about.
- The live preview flow is isolated from admin state.
- Multiple navigators could be created later if needed.

### 3. Rendering Logic

Main function:

```js
renderCurrentQuestion()
```

Supporting functions:

```js
renderMissingNodeMessage(nodeId)
renderResultNode(node)
renderQuestionNode(node)
renderAnswerOption(option)
```

- Rendering code reads like a story.
- Each function renders one type of UI state.
- Dynamic text is inserted with `textContent`, reducing XSS risk.
- The rendering layer does not directly mutate tree data.

### 4. Admin Form Logic

Important functions:

```js
buildNodeFromForm()
buildOptionsFromForm()
populateFormForEdit(nodeId)
resetFormToCreateMode()
handleAdminSubmit(event)
```


- Form reading is separated from saving.
- Validation is easier to locate.
- Adding a new option field later only requires updating `optionFields` and the HTML.
- The form does not directly mutate tree state. It builds data, then asks the store to save it.

### 5. Admin List Logic

Important functions:

```js
refreshAdminPanel()
appendNodeListItem(nodeId, node, relationship)
buildNodeInfo(nodeId, node, relationship)
buildNodeActions(nodeId)
handleEditNode(nodeId)
handleDeleteNode(nodeId)
```


- Admin list rendering is separated from action handling.
- Edit and delete buttons use `addEventListener` instead of inline `onclick`.
- No custom functions are attached to `window`.
- The list can be changed later without touching tree store logic.

## Refactor Standards Applied

### 1. Closure-based encapsulation

The tree data and navigation state are hidden inside factory functions.

Applied in:

```js
createTreeStore()
createTreeNavigator()
```

Benefit: Prevents uncontrolled shared mutable state.

### 2. Public API over direct implementation access

Outside code must use methods like `upsertNode`, `deleteNode`, `getNode`, and `goToNode`.

Benefit: Reduces coupling and makes future internal changes safer.

### 3. Single Responsibility Principle

Each function does one clear task.

Examples:

```js
buildNodeFromForm()
renderCurrentQuestion()
getMissingTargets()
appendNodeListItem()
```

Benefit: When a bug happens, the search area is smaller.

### 4. Intention-revealing names

Function names describe business intention instead of implementation detail.

Examples:

```js
renderCurrentQuestion
buildNodeFromForm
getMissingTargets
restartIfViewing
```

Benefit  A reviewer can understand the logic without reading every line.

### 5. Avoid global custom handlers

Removed pattern:

```js
window.handleEditClick = function(id) { ... };
window.handleDeleteClick = function(id) { ... };
```

New pattern:

```js
editButton.addEventListener('click', () => handleEditNode(nodeId));
deleteButton.addEventListener('click', () => handleDeleteNode(nodeId));
```

Benefit: Less global coupling and cleaner event ownership.

### 6. Avoid inline onclick

Removed HTML string event handlers.

Benefit: Lower coupling between markup strings and JavaScript function names.

### 7. Prefer textContent for dynamic text

Dynamic admin/user text is rendered with DOM methods and `textContent`.

Benefit: Safer rendering when text comes from form input.

### 8. Reduced direct DOM querying

DOM references are collected in one `dom` object.

Benefit: Less repeated `document.getElementById`, easier to maintain.

### 9. Stepdown-style structure

The code starts with constants and factories, then rendering, admin logic, event binding, and initialization.

Benefit: The file reads from high-level structure toward lower-level details.

## Refactor Explanation


I refactored the JavaScript by separating tree state, navigation state, rendering, and admin form logic. The tree state is now encapsulated inside `createTreeStore`, so outside code cannot directly mutate the internal `tree`. The navigation state is encapsulated inside `createTreeNavigator`, so `currentNodeId` and history are not global variables anymore.

I also replaced inline `onclick` and `window` handlers with `addEventListener`, because event behavior should be owned by the JavaScript module instead of global function names. For rendering dynamic text, I used `textContent` and DOM creation instead of `innerHTML` to reduce security risk when rendering data entered from the admin form.

The main benefit is lower debugging cost. If there is a bug in tree data, I inspect `createTreeStore`. If there is a bug in navigation, I inspect `createTreeNavigator`. If there is a bug in UI rendering, I inspect the render functions. This reduces cognitive load and makes future changes safer.

