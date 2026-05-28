(() => {
    'use strict';

    const START_NODE_ID = 'start';
    const MAX_PREVIEW_LENGTH = 40;

    const initialTree = {
        start: {
            type: 'question',
            text: 'Bạn muốn học mảng nào?',
            options: [
                { label: 'Frontend', next: 'frontend' },
                { label: 'Backend', next: 'backend' },
            ],
        },
        frontend: {
            type: 'question',
            text: 'Bạn muốn học gì trong Frontend?',
            options: [
                { label: 'HTML/CSS', next: 'html_css_result' },
                { label: 'JavaScript', next: 'js_result' },
            ],
        },
        backend: {
            type: 'question',
            text: 'Bạn muốn học gì trong Backend?',
            options: [
                { label: 'Node.js', next: 'node_result' },
                { label: 'Python', next: 'python_result' },
            ],
        },
        html_css_result: {
            type: 'result',
            text: 'Bạn nên học layout, flexbox, grid, responsive.',
        },
        js_result: {
            type: 'result',
            text: 'Bạn nên học DOM, event, async/await, fetch.',
        },
        node_result: {
            type: 'result',
            text: 'Bạn nên học Node.js, Express, REST API.',
        },
        python_result: {
            type: 'result',
            text: 'Bạn nên học Python, FastAPI, database.',
        },
    };

    const dom = {
        questionBox: document.getElementById('questionBox'),
        backBtn: document.getElementById('backBtn'),
        restartBtn: document.getElementById('restartBtn'),
        adminForm: document.getElementById('adminForm'),
        editSelect: document.getElementById('editSelect'),
        nodeIdInput: document.getElementById('nodeId'),
        nodeTypeSelect: document.getElementById('nodeType'),
        nodeTextInput: document.getElementById('nodeText'),
        optionsConfig: document.getElementById('optionsConfig'),
        optionsList: document.getElementById('optionsList'),
        addOptionBtn: document.getElementById('addOptionBtn'),
        submitBtn: document.getElementById('submitBtn'),
        nodeIdsList: document.getElementById('nodeIdsList'),
        nodeList: document.getElementById('nodeList'),
    };

    const deepClone = (value) => JSON.parse(JSON.stringify(value));

    const createNodeId = () => `id${Date.now()}`;

    const clearElement = (element) => {
        element.replaceChildren();
    };

    const createElement = (tagName, className, textContent = '') => {
        const element = document.createElement(tagName);

        if (className) {
            element.className = className;
        }

        if (textContent) {
            element.textContent = textContent;
        }

        return element;
    };

    const normalizeOption = (option) => {
        const label = String(option?.label || '').trim();
        const next = String(option?.next || '').trim();

        if (!label || !next) {
            return null;
        }

        return { label, next };
    };

    const normalizeNode = (node) => {
        if (!node) {
            return null;
        }

        if (node.type === 'result' || Object.prototype.hasOwnProperty.call(node, 'result')) {
            return {
                type: 'result',
                text: node.text || node.result || '',
            };
        }

        return {
            type: 'question',
            text: node.text || '',
            options: Array.isArray(node.options) ? node.options.map(normalizeOption).filter(Boolean) : [],
        };
    };

    const isResultNode = (node) => node?.type === 'result';

    const createOptionEditor = ({ listEl, nextDatalistId }) => {
        const ROLE_ROW = 'option-row';
        const ROLE_LABEL = 'option-label';
        const ROLE_NEXT = 'option-next';

        const getRows = () => Array.from(listEl.querySelectorAll('[data-role="option-row"]'));

        const renumberRows = () => {
            getRows().forEach((row, index) => {
                const indexEl = row.querySelector('.option-index');
                if (indexEl) {
                    indexEl.textContent = String(index + 1);
                }
            });
        };

        const removeRow = (rowEl) => {
            rowEl.remove();

            if (!getRows().length) {
                addBlankRow({ focus: false });
            }

            renumberRows();
        };

        const createRow = ({ label = '', next = '' } = {}) => {
            const row = createElement('div', 'option-row');
            row.dataset.role = ROLE_ROW;

            const indexEl = createElement('span', 'option-index', '1');

            const labelInput = document.createElement('input');
            labelInput.type = 'text';
            labelInput.placeholder = 'Button label';
            labelInput.dataset.role = ROLE_LABEL;

            const nextInput = document.createElement('input');
            nextInput.type = 'text';
            nextInput.placeholder = 'Next node ID';
            nextInput.dataset.role = ROLE_NEXT;
            nextInput.setAttribute('list', nextDatalistId);

            const removeBtn = createElement('button', 'option-remove-btn', 'Remove');
            removeBtn.type = 'button';
            removeBtn.addEventListener('click', () => removeRow(row));

            labelInput.value = String(label || '');
            nextInput.value = String(next || '');

            row.append(indexEl, labelInput, nextInput, removeBtn);
            return row;
        };

        const addBlankRow = ({ focus = true } = {}) => {
            const nextIndex = getRows().length + 1;
            const row = createRow();
            const indexEl = row.querySelector('.option-index');
            if (indexEl) {
                indexEl.textContent = String(nextIndex);
            }
            listEl.appendChild(row);
            if (!indexEl) {
                renumberRows();
            }

            if (focus) {
                row.querySelector('[data-role="option-label"]')?.focus();
            }
        };

        const setOptions = (options = [], { minRows = 1, appendBlankRow = false } = {}) => {
            clearElement(listEl);

            (Array.isArray(options) ? options : []).forEach((option) => {
                const normalized = normalizeOption(option);
                listEl.appendChild(createRow(normalized || {}));
            });

            while (getRows().length < minRows) {
                listEl.appendChild(createRow());
            }

            if (appendBlankRow) {
                listEl.appendChild(createRow());
            }

            renumberRows();
        };

        const reset = () => {
            setOptions([], { minRows: 2, appendBlankRow: false });
        };

        const readAndValidate = () => {
            const rows = getRows();
            const options = [];
            let firstInvalidInput = null;

            rows.forEach((row) => {
                row.classList.remove('is-invalid');

                const labelInput = row.querySelector('[data-role="option-label"]');
                const nextInput = row.querySelector('[data-role="option-next"]');

                const label = String(labelInput?.value || '').trim();
                const next = String(nextInput?.value || '').trim();

                if (!label && !next) {
                    return;
                }

                if (label && next) {
                    options.push({ label, next });
                    return;
                }

                row.classList.add('is-invalid');

                if (!firstInvalidInput) {
                    firstInvalidInput = label ? nextInput : labelInput;
                }
            });

            if (firstInvalidInput) {
                firstInvalidInput.focus();
                return { ok: false, options: [] };
            }

            return { ok: true, options };
        };

        return {
            setOptions,
            reset,
            readAndValidate,
            addBlankRow,
        };
    };

    const createTreeStore = (initialData = {}) => {
        const tree = Object.entries(initialData).reduce((normalizedTree, [id, node]) => {
            normalizedTree[id] = normalizeNode(node);
            return normalizedTree;
        }, {});

        const getNode = (nodeId) => deepClone(tree[nodeId] || null);

        const hasNode = (nodeId) => Boolean(tree[nodeId]);

        const getNodeIds = () => Object.keys(tree);

        const getTreeSnapshot = () => deepClone(tree);

        const upsertNode = (nodeId, nodeData) => {
            const id = String(nodeId || '').trim();
            const normalizedNode = normalizeNode(nodeData);

            if (!id || !normalizedNode || !normalizedNode.text) {
                return { ok: false, reason: 'Node ID and text are required.' };
            }

            tree[id] = normalizedNode;
            return { ok: true, nodeId: id };
        };

        const removeLinksToNode = (deletedNodeId) => {
            Object.values(tree).forEach((node) => {
                if (!node || isResultNode(node)) {
                    return;
                }

                node.options = node.options.filter((option) => option.next !== deletedNodeId);
            });
        };

        const deleteNode = (nodeId) => {
            if (nodeId === START_NODE_ID) {
                return { ok: false, reason: "Cannot delete the 'start' node." };
            }

            if (!hasNode(nodeId)) {
                return { ok: false, reason: `Node '${nodeId}' does not exist.` };
            }

            delete tree[nodeId];
            removeLinksToNode(nodeId);

            return { ok: true };
        };

        const getMissingTargets = (nodeData, currentNodeId = '') => {
            const node = normalizeNode(nodeData);

            if (!node || isResultNode(node)) {
                return [];
            }

            return node.options
                .map((option) => option.next)
                .filter((targetId) => targetId !== currentNodeId && !hasNode(targetId));
        };

        const getRelationships = () => {
            const relationships = getNodeIds().reduce((refs, nodeId) => {
                refs[nodeId] = { in: [], out: [] };
                return refs;
            }, {});

            Object.entries(tree).forEach(([sourceId, node]) => {
                if (!node || isResultNode(node)) {
                    return;
                }

                node.options.forEach((option) => {
                    relationships[sourceId].out.push(option.next);

                    if (relationships[option.next]) {
                        relationships[option.next].in.push(sourceId);
                    }
                });
            });

            return deepClone(relationships);
        };

        return {
            getNode,
            hasNode,
            getNodeIds,
            getTreeSnapshot,
            upsertNode,
            deleteNode,
            getMissingTargets,
            getRelationships,
        };
    };

    const createTreeNavigator = (startNodeId = START_NODE_ID) => {
        let currentNodeId = startNodeId;
        let historyStack = [];

        const getCurrentNodeId = () => currentNodeId;

        const goToNode = (nextNodeId) => {
            historyStack.push(currentNodeId);
            currentNodeId = nextNodeId;
        };

        const goBack = () => {
            if (!historyStack.length) {
                return false;
            }

            currentNodeId = historyStack.pop();
            return true;
        };

        const restart = () => {
            currentNodeId = startNodeId;
            historyStack = [];
        };

        const previewNode = (nodeId) => {
            currentNodeId = nodeId;
            historyStack = nodeId === startNodeId ? [] : [startNodeId];
        };

        const restartIfViewing = (nodeId) => {
            if (currentNodeId === nodeId) {
                restart();
            }
        };

        return {
            getCurrentNodeId,
            goToNode,
            goBack,
            restart,
            previewNode,
            restartIfViewing,
        };
    };

    const treeStore = createTreeStore(initialTree);
    const navigator = createTreeNavigator(START_NODE_ID);
    const optionEditor = createOptionEditor({ listEl: dom.optionsList, nextDatalistId: 'nodeIdsList' });

    const renderCurrentQuestion = () => {
        const currentNodeId = navigator.getCurrentNodeId();
        const currentNode = treeStore.getNode(currentNodeId);

        clearElement(dom.questionBox);

        if (!currentNode) {
            renderMissingNodeMessage(currentNodeId);
            return;
        }

        if (isResultNode(currentNode)) {
            renderResultNode(currentNode);
            return;
        }

        renderQuestionNode(currentNode);
    };

    const renderMissingNodeMessage = (nodeId) => {
        const message = createElement(
            'p',
            'result error-result',
            `Error: Node '${nodeId}' not found. The Admin needs to add this node.`,
        );

        dom.questionBox.appendChild(message);
    };

    const renderResultNode = (node) => {
        const result = createElement('div', 'result', node.text);
        dom.questionBox.appendChild(result);
    };

    const renderQuestionNode = (node) => {
        const title = createElement('p', 'question-title', node.text);
        dom.questionBox.appendChild(title);

        if (!node.options.length) {
            const deadEndMessage = createElement(
                'p',
                'result error-result',
                'No options available. This is a dead end.',
            );
            dom.questionBox.appendChild(deadEndMessage);
            return;
        }

        node.options.forEach(renderAnswerOption);
    };

    const renderAnswerOption = (option) => {
        const button = createElement('button', 'option-btn', `${option.label} ->`);
        button.type = 'button';

        button.addEventListener('click', () => {
            navigator.goToNode(option.next);
            renderCurrentQuestion();
        });

        dom.questionBox.appendChild(button);
    };

    const syncOptionsVisibility = () => {
        dom.optionsConfig.style.display = dom.nodeTypeSelect.value === 'question' ? 'flex' : 'none';
    };

    const resetFormToCreateMode = () => {
        dom.adminForm.reset();
        dom.editSelect.value = '';
        dom.nodeIdInput.value = createNodeId();
        dom.nodeIdInput.readOnly = true;
        dom.submitBtn.textContent = 'Save New Node';
        dom.adminForm.classList.remove('highlight-form');
        optionEditor.reset();
        syncOptionsVisibility();
    };

    const populateFormForEdit = (nodeId) => {
        const node = treeStore.getNode(nodeId);

        if (!node) {
            return;
        }

        dom.adminForm.classList.add('highlight-form');
        dom.submitBtn.textContent = 'Update Node';
        dom.editSelect.value = nodeId;
        dom.nodeIdInput.value = nodeId;
        dom.nodeIdInput.readOnly = true;
        dom.nodeTypeSelect.value = node.type;
        dom.nodeTextInput.value = node.text;

        if (isResultNode(node)) {
            optionEditor.setOptions([], { minRows: 2, appendBlankRow: false });
        } else {
            optionEditor.setOptions(node.options, { minRows: 1, appendBlankRow: true });
        }

        syncOptionsVisibility();
    };

    const buildNodeFromForm = () => {
        const type = dom.nodeTypeSelect.value;
        const text = dom.nodeTextInput.value.trim();

        if (type === 'result') {
            return { type: 'result', text };
        }

        const readResult = optionEditor.readAndValidate();

        if (!readResult.ok) {
            window.alert('Each option must have both a label and a next node. Clear the row or complete it.');
            return { ok: false, node: null };
        }

        if (!readResult.options.length) {
            window.alert('Question nodes must have at least 1 option.');
            return { ok: false, node: null };
        }

        return {
            ok: true,
            node: {
                type: 'question',
                text,
                options: readResult.options,
            },
        };
    };

    const confirmMissingTargets = (missingTargets) => {
        return window.confirm(
            `Warning: The target node(s) '${missingTargets.join("', '")}' do not exist yet. This will create a broken link until you add them.\n\nSave anyway?`,
        );
    };

    const handleAdminSubmit = (event) => {
        event.preventDefault();

        const nodeId = dom.nodeIdInput.value.trim();
        const type = dom.nodeTypeSelect.value;
        const text = dom.nodeTextInput.value.trim();

        if (!nodeId || !text) {
            return;
        }

        let nodeData = null;

        if (type === 'result') {
            nodeData = { type: 'result', text };
        } else {
            const buildResult = buildNodeFromForm();
            if (!buildResult.ok) {
                return;
            }
            nodeData = buildResult.node;
        }

        const missingTargets = treeStore.getMissingTargets(nodeData, nodeId);

        if (missingTargets.length && !confirmMissingTargets(missingTargets)) {
            return;
        }

        const saveResult = treeStore.upsertNode(nodeId, nodeData);

        if (!saveResult.ok) {
            window.alert(saveResult.reason);
            return;
        }

        resetFormToCreateMode();
        refreshAdminPanel();
        navigator.previewNode(nodeId);
        renderCurrentQuestion();
    };

    const refreshAdminPanel = () => {
        clearElement(dom.editSelect);
        clearElement(dom.nodeIdsList);
        clearElement(dom.nodeList);

        appendCreateOption();

        const relationships = treeStore.getRelationships();
        const treeSnapshot = treeStore.getTreeSnapshot();

        Object.entries(treeSnapshot).forEach(([nodeId, node]) => {
            appendEditOption(nodeId);
            appendNodeIdSuggestion(nodeId);
            appendNodeListItem(nodeId, node, relationships[nodeId]);
        });
    };

    const appendCreateOption = () => {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '+ Create New Node';
        dom.editSelect.appendChild(option);
    };

    const appendEditOption = (nodeId) => {
        const option = document.createElement('option');
        option.value = nodeId;
        option.textContent = `Edit: ${nodeId}`;
        dom.editSelect.appendChild(option);
    };

    const appendNodeIdSuggestion = (nodeId) => {
        const option = document.createElement('option');
        option.value = nodeId;
        dom.nodeIdsList.appendChild(option);
    };

    const appendNodeListItem = (nodeId, node, relationship) => {
        const listItem = createElement('li', 'node-item');
        const nodeInfo = buildNodeInfo(nodeId, node, relationship);
        const nodeActions = buildNodeActions(nodeId);

        listItem.append(nodeInfo, nodeActions);
        dom.nodeList.appendChild(listItem);
    };

    const formatPreviewText = (text) => {
        return text.length > MAX_PREVIEW_LENGTH ? `${text.slice(0, MAX_PREVIEW_LENGTH)}...` : text;
    };

    const buildRelationshipText = (relationship) => {
        const container = createElement('div', 'node-relationships');
        const incoming = relationship.in.length ? relationship.in.join(', ') : 'None';
        const outgoing = relationship.out.length ? relationship.out.join(', ') : 'None';

        container.append(
            document.createTextNode(`Linked from: ${incoming}`),
            document.createElement('br'),
            document.createTextNode(`Points to: ${outgoing}`),
        );

        return container;
    };

    const buildNodeInfo = (nodeId, node, relationship = { in: [], out: [] }) => {
        const nodeInfo = createElement('div', 'node-info');
        const nodeTitle = createElement('div', 'node-id', nodeId);
        const badge = createElement('span', isResultNode(node) ? 'badge result' : 'badge', isResultNode(node) ? 'Result' : 'Question');
        const preview = createElement('div', 'node-preview', `"${formatPreviewText(node.text)}"`);
        const relationships = buildRelationshipText(relationship);

        nodeTitle.appendChild(badge);
        nodeInfo.append(nodeTitle, preview, relationships);

        return nodeInfo;
    };

    const buildNodeActions = (nodeId) => {
        const actions = createElement('div', 'node-actions');
        const editButton = createElement('button', 'edit-btn', 'Edit');
        const deleteButton = createElement('button', 'delete-btn', 'Delete');

        editButton.type = 'button';
        deleteButton.type = 'button';

        editButton.addEventListener('click', () => handleEditNode(nodeId));
        deleteButton.addEventListener('click', () => handleDeleteNode(nodeId));

        actions.append(editButton, deleteButton);
        return actions;
    };

    const handleEditNode = (nodeId) => {
        populateFormForEdit(nodeId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteNode = (nodeId) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete '${nodeId}'? This will also remove any buttons pointing to it.`,
        );

        if (!confirmed) {
            return;
        }

        const deleteResult = treeStore.deleteNode(nodeId);

        if (!deleteResult.ok) {
            window.alert(deleteResult.reason);
            return;
        }

        navigator.restartIfViewing(nodeId);
        resetFormToCreateMode();
        refreshAdminPanel();
        renderCurrentQuestion();
    };

    const bindEvents = () => {
        dom.nodeTypeSelect.addEventListener('change', syncOptionsVisibility);
        dom.adminForm.addEventListener('submit', handleAdminSubmit);

        dom.addOptionBtn.addEventListener('click', () => {
            optionEditor.addBlankRow();
        });

        dom.editSelect.addEventListener('change', (event) => {
            const selectedNodeId = event.target.value;

            if (selectedNodeId) {
                populateFormForEdit(selectedNodeId);
            } else {
                resetFormToCreateMode();
            }
        });

        dom.backBtn.addEventListener('click', () => {
            if (navigator.goBack()) {
                renderCurrentQuestion();
            }
        });

        dom.restartBtn.addEventListener('click', () => {
            navigator.restart();
            renderCurrentQuestion();
        });
    };

    const init = () => {
        bindEvents();
        resetFormToCreateMode();
        refreshAdminPanel();
        renderCurrentQuestion();
    };

    init();
})();
