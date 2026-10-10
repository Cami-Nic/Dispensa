
/* =========================================================
   LA MIA DISPENSA — script.js
   Prodotti, categorie, quantità, salvataggio e scanner
   ========================================================= */

"use strict";

/* CONFIGURAZIONE */

const STORAGE_KEY = "laMiaDispensaProdotti";

const CATEGORIES = ["Cibo", "Bagno", "Pulizia"];

let products = [];
let scanner = null;
let scannerLocked = false;
let scannerStarting = false;

/* ELEMENTI HTML */

const $ = (id) => document.getElementById(id);

/* INIZIALIZZAZIONE */

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    bindEvents();
    renderProducts();
});

/* EVENTI */


function bindEvents() {
    bindClick("addProductBtn", () => openProductModal());
    bindClick("addProductButton", () => openProductModal());
    bindClick("closeProductModal", closeProductModal);
    bindClick("cancelProductBtn", closeProductModal);

    // Apertura scanner
    bindClick("openScannerBtn", openScanner);
    bindClick("scanBarcodeBtn", openScanner);
    bindClick("closeScannerBtn", closeScanner);
    bindClick("closeScanner", closeScanner);

    // Ricerca prodotti
    const searchInput = $("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", renderProducts);
    }

    // Filtro categoria
    const categoryFilter = $("categoryFilter");
    if (categoryFilter) {
        categoryFilter.addEventListener("change", renderProducts);
    }

    // Salvataggio: un solo gestore per evitare duplicazioni
    const form = $("productForm");

    if (form) {
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            saveProduct();
        });
    } else {
        bindClick("saveProductBtn", saveProduct);
        bindClick("productFormSubmit", saveProduct);
    }

    // Chiusura modali cliccando sullo sfondo
    const productModal = $("productModal");
    if (productModal) {
        productModal.addEventListener("click", function(event) {
            if (event.target === productModal) {
                closeProductModal();
            }
        });
    }

    const scannerModal = $("scannerModal");
    if (scannerModal) {
        scannerModal.addEventListener("click", function(event) {
            if (event.target === scannerModal) {
                closeScanner();
            }
        });
    }
}

    // Chiude i modali cliccando sullo sfondo
    const productModal = $("productModal");
    if (productModal) {
        productModal.addEventListener("click", (event) => {
            if (event.target === productModal) {
                closeProductModal();
            }
        });
    }

    const scannerModal = $("scannerModal");
    if (scannerModal) {
        scannerModal.addEventListener("click", (event) => {
            if (event.target === scannerModal) {
                closeScanner();
            }
        });
    }
}

function bindClick(id, callback) {
    const element = $(id);
    if (element) {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            callback();
        });
    }
}

/* SALVATAGGIO LOCALE */

function loadProducts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        products = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Errore nel caricamento dei prodotti:", error);
        products = [];
    }

    saveProducts();
}

function saveProducts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
        console.error("Errore nel salvataggio dei prodotti:", error);
        alert("Non è stato possibile salvare i dati nel browser.");
    }
}

/* PRODOTTI: APERTURA E CHIUSURA MODALE */

function openProductModal(productId = null) {
    const modal = $("productModal");
    const form = $("productForm");

    if (form) {
        form.reset();
    }

    const idField = $("productId");
    if (idField) {
        idField.value = productId || "";
    }

    if (productId) {
        const product = products.find(
            (item) => String(item.id) === String(productId)
        );

        if (!product) return;

        setField("productName", product.name);
        setField("productCategory", product.category);
        setField("productQuantity", product.quantity);
        setField("productBarcode", product.barcode || "");
        setField("productExpiry", product.expiry || "");
        setField("productNotes", product.notes || "");
    } else {
        setField("productQuantity", 1);
    }

    if (modal) {
        modal.style.display = "flex";
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
    }
}

function closeProductModal() {
    const modal = $("productModal");
    if (!modal) return;

    modal.classList.remove("active");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

function setField(id, value) {
    const element = $(id);
    if (element && value !== undefined && value !== null) {
        element.value = value;
    }
}

/* AGGIUNTA E MODIFICA PRODOTTI */

function saveProduct() {
    const name = getFieldValue("productName").trim();

    if (!name) {
        alert("Inserisci il nome del prodotto.");
        return;
    }

    const category =
        getFieldValue("productCategory") ||
        getFieldValue("category") ||
        "Cibo";

    const quantityValue = Number(getFieldValue("productQuantity"));
    const quantity = Number.isFinite(quantityValue)
        ? Math.max(0, quantityValue)
        : 1;

    const id = getFieldValue("productId");

    const productData = {
        name,
        category,
        quantity,
        barcode: getFieldValue("productBarcode").trim(),
        expiry: getFieldValue("productExpiry"),
        notes: getFieldValue("productNotes").trim()
    };

    if (id) {
        const index = products.findIndex(
            (item) => String(item.id) === String(id)
        );

        if (index !== -1) {
            products[index] = {
                ...products[index],
                ...productData
            };
        } else {
            products.push({
                id: createId(),
                ...productData
            });
        }
    } else {
        products.push({
            id: createId(),
            ...productData
        });
    }

    saveProducts();
    renderProducts();
    closeProductModal();
}

function getFieldValue(id) {
    const element = $(id);
    return element ? String(element.value || "") : "";
}

function createId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9)
    );
}

/* QUANTITÀ */

function changeQuantity(productId, amount) {
    const product = products.find(
        (item) => String(item.id) === String(productId)
    );

    if (!product) return;

    const currentQuantity = Number(product.quantity) || 0;
    product.quantity = Math.max(0, currentQuantity + amount);

    saveProducts();
    renderProducts();
}

function increaseQuantity(productId) {
    changeQuantity(productId, 1);
}

function decreaseQuantity(productId) {
    changeQuantity(productId, -1);
}

/* ELIMINAZIONE */

function deleteProduct(productId) {
    const product = products.find(
        (item) => String(item.id) === String(productId)
    );

    if (!product) return;

    if (!confirm(`Vuoi eliminare "${product.name}"?`)) {
        return;
    }

    products = products.filter(
        (item) => String(item.id) !== String(productId)
    );

    saveProducts();
    renderProducts();
}

/* VISUALIZZAZIONE */

function renderProducts() {
    const container =
        $("productsList") ||
        $("productList") ||
        $("productsContainer");

    if (!container) {
        console.warn(
            "Contenitore prodotti non trovato. Controlla l'ID nel file index.html."
        );
        return;
    }

    const search = getFieldValue("searchInput").toLowerCase().trim();
    const selectedCategory = getFieldValue("categoryFilter");

    const filtered = products.filter((product) => {
        const matchesSearch =
            String(product.name || "").toLowerCase().includes(search) ||
            String(product.barcode || "").includes(search);

        const matchesCategory =
            !selectedCategory ||
            selectedCategory === "Tutte" ||
            selectedCategory === "all" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        container.innerHTML =
            '<p class="empty-state">Nessun prodotto trovato.</p>';
        updateProductCount();
        return;
    }

    container.innerHTML = filtered.map((product) => {
        const safeId = escapeHtml(String(product.id));
        const safeName = escapeHtml(product.name || "");
        const safeCategory = escapeHtml(product.category || "Cibo");
        const safeBarcode = escapeHtml(product.barcode || "");
        const safeExpiry = escapeHtml(product.expiry || "");
        const safeNotes = escapeHtml(product.notes || "");
        const quantity = Math.max(0, Number(product.quantity) || 0);

        return `
            <article class="product-card" data-id="${safeId}">
                <div class="product-info">
                    <h3>${safeName}</h3>
                    <span class="product-category">${safeCategory}</span>

                    ${safeBarcode
                        ? `<p class="product-barcode">Codice: ${safeBarcode}</p>`
                        : ""}

                    ${safeExpiry
                        ? `<p class="product-expiry">Scadenza: ${safeExpiry}</p>`
                        : ""}

                    ${safeNotes
                        ? `<p class="product-notes">${safeNotes}</p>`
                        : ""}
                </div>

                <div class="quantity-controls">
                    <button type="button"
                        class="quantity-btn"
                        aria-label="Diminuisci quantità"
                        data-action="decrease"
                        data-id="${safeId}">−</button>

                    <span class="product-quantity">${quantity}</span>

                    <button type="button"
                        class="quantity-btn"
                        aria-label="Aumenta quantità"
                        data-action="increase"
                        data-id="${safeId}">+</button>
                </div>

                <div class="product-actions">
                    <button type="button"
                        data-action="edit"
                        data-id="${safeId}">Modifica</button>

                    <button type="button"
                        data-action="delete"
                        data-id="${safeId}">Elimina</button>
                </div>
            </article>
        `;
    }).join("");

    updateProductCount();
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return entities[character];
    });
}

function updateProductCount() {
    const countElement =
        $("productCount") ||
        $("totalProducts");

    if (countElement) {
        countElement.textContent = String(products.length);
    }
}

/* EVENTI DEI PRODOTTI GENERATI */

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (!id) return;

    switch (action) {
        case "increase":
            increaseQuantity(id);
            break;

        case "decrease":
            decreaseQuantity(id);
            break;

        case "edit":
            openProductModal(id);
            break;

        case "delete":
            deleteProduct(id);
            break;
    }
});

/* SCANNER BARCODE */

async function openScanner() {
    const modal = $("scannerModal");
    const reader = $("reader");

    if (!modal || !reader) {
        alert(
            'Scanner non configurato: controlla che index.html contenga gli elementi "scannerModal" e "reader".'
        );
        return;
    }

    modal.style.display = "flex";
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    scannerLocked = false;

    await startScanner();
}

async function startScanner() {
    if (scannerStarting) return;

    if (typeof Html5Qrcode === "undefined") {
        updateScannerStatus(
            "Libreria scanner non caricata. Controlla la connessione internet."
        );
        return;
    }

    scannerStarting = true;

    try {
        if (scanner) {
            try {
                await scanner.stop();
            } catch (_) {
                // La scansione potrebbe essere già ferma.
            }

            try {
                await scanner.clear();
            } catch (_) {
                // Il lettore potrebbe essere già stato pulito.
            }

            scanner = null;
        }

        scanner = new Html5Qrcode("reader", {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.ITF
            ],
            verbose: false
        });

        updateScannerStatus(
            "Avvio fotocamera frontale…"
        );

        await scanner.start(
            { facingMode: "user" },
            {
                fps: 15,
                qrbox: (viewWidth, viewHeight) => ({
                    width: Math.floor(viewWidth * 0.9),
                    height: Math.floor(viewHeight * 0.35)
                }),
                aspectRatio: 1.7778,
                disableFlip: false
            },
            onScanSuccess,
            onScanFailure
        );

        // Tenta la messa a fuoco continua, se supportata dal dispositivo.
        try {
            await scanner.applyVideoConstraints({
                advanced: [{ focusMode: "continuous" }]
            });
        } catch (_) {
            // Non tutti i browser supportano questa opzione.
        }

        updateScannerStatus(
            "Inquadra il codice a barre con la fotocamera frontale."
        );
    } catch (error) {
        console.error("Errore scanner:", error);

        updateScannerStatus(
            "Impossibile avviare la fotocamera. Verifica i permessi e apri la pagina tramite HTTPS."
        );
    } finally {
        scannerStarting = false;
    }
}

function onScanSuccess(decodedText) {
    if (scannerLocked) return;

    const barcode = String(decodedText || "").trim();
    if (!barcode) return;

    scannerLocked = true;

    const barcodeInput = $("productBarcode");
    if (barcodeInput) {
        barcodeInput.value = barcode;
    }

    updateScannerStatus(`Codice letto: ${barcode}`);

    // Cerca il prodotto online, se la funzione è disponibile.
    if (typeof lookupOpenFoodFacts === "function") {
        setTimeout(async () => {
            try {
                await closeScanner();
                await lookupOpenFoodFacts(barcode);
            } catch (error) {
                console.error("Errore ricerca prodotto:", error);
            }
        }, 300);
    } else {
        setTimeout(() => {
            closeScanner();
        }, 500);
    }
}

function onScanFailure(_error) {
    // Gli errori di lettura momentanei sono normali.
}

function updateScannerStatus(message) {
    const status = $("scannerStatus");
    if (status) {
        status.textContent = message;
    }
}

async function closeScanner() {
    const modal = $("scannerModal");

    if (scanner) {
        try {
            const state = scanner.getState();

            if (state === Html5QrcodeScannerState.SCANNING) {
                await scanner.stop();
            }
        } catch (error) {
            console.warn("Arresto scanner:", error);
        }

        try {
            await scanner.clear();
        } catch (_) {
            // Nessuna azione necessaria.
        }

        scanner = null;
    }

    scannerLocked = false;

    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }
}

/* OPEN FOOD FACTS */

async function lookupOpenFoodFacts(barcode) {
    const status = $("scannerStatus");

    if (status) {
        status.textContent = "Ricerca prodotto in corso…";
    }

    try {
        const url =
            "https://world.openfoodfacts.org/api/v2/product/" +
            encodeURIComponent(barcode) +
            ".json";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Errore nella richiesta al servizio.");
        }

        const data = await response.json();

        if (data.status !== 1 || !data.product) {
            alert(
                "Codice letto correttamente, ma il prodotto non è presente in Open Food Facts. Puoi inserirlo manualmente."
            );
            return;
        }

        const product = data.product;

        const nameInput = $("productName");
        if (nameInput && product.product_name) {
            nameInput.value = product.product_name;
        }

        const categoryInput = $("productCategory");
        if (categoryInput) {
            categoryInput.value = inferCategory(product);
        }

        const barcodeInput = $("productBarcode");
        if (barcodeInput) {
            barcodeInput.value = barcode;
        }

        // Mostra il modulo prodotto se presente.
        const productModal = $("productModal");
        if (productModal) {
            productModal.style.display = "flex";
            productModal.classList.add("active");
            productModal.setAttribute("aria-hidden", "false");
        }
    } catch (error) {
        console.error("Errore Open Food Facts:", error);

        alert(
            "Non è stato possibile recuperare i dettagli online. Il codice a barre è stato conservato: completa i dati manualmente."
        );
    }
}

function inferCategory(product) {
    const text = [
        product.categories || "",
        product.categories_tags
            ? product.categories_tags.join(" ")
            : "",
        product.product_name || ""
    ].join(" ").toLowerCase();

    if (
        /shampoo|sapone|dentifricio|bagnoschiuma|deodorante|crema corpo|body wash|toothpaste/.test(text)
    ) {
        return "Bagno";
    }

    if (
        /detersivo|candeggina|ammorbidente|sgrassatore|detergente pavimenti|cleaner|laundry/.test(text)
    ) {
        return "Pulizia";
    }

    return "Cibo";
}
