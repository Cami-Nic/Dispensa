
"use strict";

/* =========================================
   LA MIA DISPENSA - SCRIPT COMPLETO
   ========================================= */

const STORAGE_KEY = "laMiaDispensaProdotti";

const CATEGORIES = [
    { id: "cibo", name: "Cibo", icon: "🍝", pantry: "casa" },
    { id: "bagno", name: "Prodotti bagno", icon: "🧴", pantry: "casa" },
    { id: "pulizia", name: "Prodotti pulizia", icon: "🧹", pantry: "cantina" }
];

let products = [];
let currentPantry = "casa";
let currentCategory = "cibo";
let currentFilter = "all";
let editingProductId = null;
let scanner = null;
let scannerStarting = false;
let scannerClosing = false;
let scannerLocked = false;

const $ = (id) => document.getElementById(id);

/* =========================================
   INIZIALIZZAZIONE
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    renderCategoryCards();
    bindEvents();
    showScreen("homeScreen");
});

function bindEvents() {
    // Impedisce che eventuali pulsanti interni ai contenitori
    // provochino un invio involontario di moduli.
    document.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (button && !button.hasAttribute("type")) {
            button.type = "button";
        }
    });

    const search = $("searchInput");
    if (search) {
        search.addEventListener("input", renderProducts);
    }

    // Supporta anche i clic sullo sfondo dei modali.
    ["productModal", "scannerModal"].forEach((id) => {
        const modal = $(id);
        if (!modal) return;

        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                if (id === "productModal") closeProductModal();
                else closeScanner();
            }
        });
    });

    // Gestione dei pulsanti generati per ogni prodotto.
    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const id = button.dataset.id;
        switch (button.dataset.action) {
            case "increase":
                changeQuantity(id, 1);
                break;
            case "decrease":
                changeQuantity(id, -1);
                break;
            case "edit":
                openProductModal(id);
                break;
            case "delete":
                deleteProduct(id);
                break;
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeProductModal();
            closeScanner();
        }
    });
}

/* =========================================
   NAVIGAZIONE
   ========================================= */

function showScreen(id) {
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active");
    });

    const target = $(id);
    if (target) target.classList.add("active");
}

function openDispensa(pantry) {
    currentPantry = pantry === "cantina" ? "cantina" : "casa";

    const title = $("dispensaTitle");
    if (title) {
        title.textContent =
            currentPantry === "casa"
                ? "Dispensa Casa"
                : "Dispensa Cantina";
    }

    renderCategoryCards();
    showScreen("dispensaScreen");
}

function goHome() {
    showScreen("homeScreen");
}

function backToDispensa() {
    showScreen("dispensaScreen");
    renderCategoryCards();
}

function openCategory(categoryId) {
    const category = CATEGORIES.find((item) => item.id === categoryId);
    if (!category) return;

    currentCategory = category.id;
    currentPantry = category.pantry;
    currentFilter = "all";

    const title = $("categoryTitle");
    const subtitle = $("categorySubtitle");

    if (title) title.textContent = category.name;
    if (subtitle) {
        subtitle.textContent =
            category.id === "cibo"
                ? "Dispensa e alimentari"
                : category.id === "bagno"
                    ? "Igiene e cura personale"
                    : "Detergenti e prodotti per la casa";
    }

    const search = $("searchInput");
    if (search) search.value = "";

    updateFilterButtons();
    showScreen("categoryScreen");
    renderProducts();
}

function renderCategoryCards() {
    const container = $("categoryCards");
    if (!container) return;

    const categories = CATEGORIES.filter(
        (category) => category.pantry === currentPantry
    );

    container.innerHTML = categories.map((category) => {
        const count = products.filter(
            (product) => product.category === category.id
        ).length;

        return `
            <button type="button"
                class="home-card"
                data-open-category="${category.id}">
                <div class="home-card-icon">${category.icon}</div>
                <div class="home-card-title">${escapeHtml(category.name)}</div>
                <div class="home-card-subtitle">
                    ${count} ${count === 1 ? "prodotto" : "prodotti"}
                </div>
                <div class="home-card-arrow">→</div>
            </button>
        `;
    }).join("");
}

// Clic sulle categorie generate.
document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-category]");
    if (button) openCategory(button.dataset.openCategory);
});

/* =========================================
   FILTRI
   ========================================= */

function setFilter(filter) {
    currentFilter = filter === "low" ? "low" : "all";
    updateFilterButtons();
    renderProducts();
}

function updateFilterButtons() {
    const all = $("filterAll");
    const low = $("filterLow");

    if (all) {
        all.classList.toggle("active", currentFilter === "all");
    }

    if (low) {
        low.classList.toggle("active", currentFilter === "low");
    }
}

/* =========================================
   ARCHIVIAZIONE LOCALE
   ========================================= */

function loadProducts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : [];

        products = Array.isArray(data)
            ? data.filter((item) => item && typeof item === "object")
            : [];

        // Compatibilità con prodotti salvati dal vecchio script.
        products = products.map((product) => {
            let category = String(product.category || "cibo").toLowerCase();

            if (category === "bagno") category = "bagno";
            else if (category === "pulizia") category = "pulizia";
            else if (category !== "cibo") category = "cibo";

            return {
                id: product.id || createId(),
                name: product.name || "",
                brand: product.brand || "",
                format: product.format || "",
                quantity: Math.max(0, Number(product.quantity) || 0),
                minStock: Math.max(0, Number(product.minStock ?? 1) || 0),
                category,
                barcode: product.barcode || "",
                image: product.image || product.imageUrl || "",
                expiry: product.expiry || "",
                notes: product.notes || ""
            };
        });
    } catch (error) {
        console.error("Errore nel caricamento:", error);
        products = [];
    }
}

function saveProducts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        return true;
    } catch (error) {
        console.error("Errore nel salvataggio:", error);
        showToast("Errore: impossibile salvare i prodotti.");
        return false;
    }
}

function createId() {
    return typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* =========================================
   MODALE PRODOTTO
   ========================================= */

function openProductModal(productId = null) {
    const modal = $("productModal");
    if (!modal) {
        showToast("Modale prodotto non trovato.");
        return;
    }

    editingProductId = productId == null ? null : String(productId);

    const product = editingProductId
        ? products.find((item) => String(item.id) === editingProductId)
        : null;

    if (editingProductId && !product) {
        showToast("Prodotto non trovato.");
        return;
    }

    setField("productName", product?.name || "");
    setField("productBrand", product?.brand || "");
    setField("productFormat", product?.format || "");
    setField("productQuantity", product ? product.quantity : 1);
    setField("productMinStock", product ? product.minStock : 1);
    setField("productCategory", product?.category || currentCategory);
    setField("productBarcode", product?.barcode || "");
    setField("productImage", product?.image || "");

    const title = $("productModalTitle");
    if (title) {
        title.textContent = product ? "Modifica prodotto" : "Nuovo prodotto";
    }

    const deleteButton = $("deleteProductButton");
    if (deleteButton) {
        deleteButton.style.display = product ? "block" : "none";
    }

    modal.style.display = "flex";
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
        const nameInput = $("productName");
        if (nameInput) nameInput.focus();
    }, 50);
}

function closeProductModal() {
    const modal = $("productModal");
    if (!modal) return;

    modal.classList.remove("active");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    editingProductId = null;
}

function closeModalOutside(event, modalId) {
    if (event.target.id !== modalId) return;

    if (modalId === "productModal") closeProductModal();
    if (modalId === "scannerModal") closeScanner();
}

function setField(id, value) {
    const element = $(id);
    if (element) element.value = value == null ? "" : String(value);
}

function getField(id) {
    const element = $(id);
    return element ? String(element.value || "").trim() : "";
}

/* =========================================
   SALVATAGGIO PRODOTTO
   ========================================= */

function saveProduct() {
    const name = getField("productName");

    if (!name) {
        showToast("Inserisci il nome del prodotto.");
        const input = $("productName");
        if (input) input.focus();
        return;
    }

    const quantityRaw = getField("productQuantity");
    const minRaw = getField("productMinStock");

    const quantity = quantityRaw === "" ? 1 : Number(quantityRaw);
    const minStock = minRaw === "" ? 1 : Number(minRaw);

    if (!Number.isFinite(quantity) || quantity < 0 ||
        !Number.isFinite(minStock) || minStock < 0) {
        showToast("Inserisci quantità valide.");
        return;
    }

    const category = getField("productCategory");
    const validCategory = CATEGORIES.some((item) => item.id === category)
        ? category
        : currentCategory;

    const productData = {
        name,
        brand: getField("productBrand"),
        format: getField("productFormat"),
        quantity,
        minStock,
        category: validCategory,
        barcode: getField("productBarcode"),
        image: getField("productImage")
    };

    const oldProducts = products.map((item) => ({ ...item }));

    if (editingProductId) {
        const index = products.findIndex(
            (item) => String(item.id) === editingProductId
        );

        if (index < 0) {
            showToast("Prodotto non trovato.");
            return;
        }

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

    if (!saveProducts()) {
        products = oldProducts;
        return;
    }

    closeProductModal();
    renderCategoryCards();
    renderProducts();
    showToast("Prodotto salvato!");
}

/* =========================================
   QUANTITÀ
   ========================================= */

function changeQuantity(productId, amount) {
    const product = products.find(
        (item) => String(item.id) === String(productId)
    );

    if (!product) return;

    const previous = product.quantity;
    product.quantity = Math.max(0, (Number(product.quantity) || 0) + amount);

    if (!saveProducts()) {
        product.quantity = previous;
        return;
    }

    renderProducts();
    renderCategoryCards();
}

/* =========================================
   ELIMINAZIONE
   ========================================= */

function deleteProduct(productId = null) {
    const id = productId == null ? editingProductId : String(productId);

    if (!id) return;

    const product = products.find((item) => String(item.id) === String(id));
    if (!product) return;

    if (!confirm(`Vuoi eliminare "${product.name}"?`)) return;

    const previous = products.slice();
    products = products.filter((item) => String(item.id) !== String(id));

    if (!saveProducts()) {
        products = previous;
        return;
    }

    closeProductModal();
    renderProducts();
    renderCategoryCards();
    showToast("Prodotto eliminato.");
}

/* =========================================
   RENDER PRODOTTI
   ========================================= */

function renderProducts() {
    const container = $("productsList");
    if (!container) return;

    const search = getField("searchInput").toLowerCase();

    const filtered = products.filter((product) => {
        if (product.category !== currentCategory) return false;

        const matchesSearch =
            product.name.toLowerCase().includes(search) ||
            String(product.brand || "").toLowerCase().includes(search) ||
            String(product.barcode || "").includes(search);

        const matchesLow =
            currentFilter !== "low" ||
            Number(product.quantity) <= Number(product.minStock);

        return matchesSearch && matchesLow;
    });

    if (!filtered.length) {
        container.innerHTML =
            '<p class="empty-state">Nessun prodotto trovato.</p>';
        return;
    }

    container.innerHTML = filtered.map((product) => {
        const id = escapeHtml(String(product.id));
        const name = escapeHtml(product.name);
        const brand = escapeHtml(product.brand || "");
        const format = escapeHtml(product.format || "");
        const image = safeImageUrl(product.image || "");
        const quantity = Math.max(0, Number(product.quantity) || 0);
        const minStock = Math.max(0, Number(product.minStock) || 0);
        const low = quantity <= minStock;

        return `
            <article class="product-card" data-id="${id}">
                ${image ? `
                    <img class="product-image"
                         src="${escapeHtml(image)}"
                         alt="${escapeHtml(product.name)}"
                         loading="lazy"
                         onerror="this.style.display='none'">
                ` : ""}

                <div class="product-info">
                    <h3>${escapeHtml(product.name)}</h3>
                    ${brand ? `<p>Marca: ${brand}</p>` : ""}
                    ${format ? `<p>Formato: ${format}</p>` : ""}
                    <span class="product-category">
                        ${escapeHtml(categoryName(product.category))}
                    </span>
                    ${product.barcode
                        ? `<p>Codice: ${escapeHtml(product.barcode)}</p>`
                        : ""}
                    ${low ? '<p class="low-stock">Scorta bassa</p>' : ""}
                </div>

                <div class="quantity-controls">
                    <button type="button"
                        class="quantity-btn"
                        data-action="decrease"
                        data-id="${id}"
                        aria-label="Diminuisci quantità">−</button>

                    <span class="product-quantity">${quantity}</span>

                    <button type="button"
                        class="quantity-btn"
                        data-action="increase"
                        data-id="${id}"
                        aria-label="Aumenta quantità">+</button>
                </div>

                <div class="product-actions">
                    <button type="button"
                        data-action="edit"
                        data-id="${id}">Modifica</button>

                    <button type="button"
                        data-action="delete"
                        data-id="${id}">Elimina</button>
                </div>
            </article>
        `;
    }).join("");
}

function categoryName(id) {
    const category = CATEGORIES.find((item) => item.id === id);
    return category ? category.name : "Cibo";
}

function safeImageUrl(value) {
    try {
        const url = new URL(value);
        return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch (_) {
        return "";
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

/* =========================================
   NOTIFICHE
   ========================================= */

function showToast(message) {
    const toast = $("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

/* =========================================
   SCANNER BARCODE
   ========================================= */

async function openScanner() {
    const modal = $("scannerModal");
    const reader = $("reader");

    if (!modal || !reader) {
        showToast("Elementi dello scanner mancanti nell'HTML.");
        return;
    }

    if (scannerStarting || scannerClosing) return;

    modal.style.display = "flex";
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    scannerLocked = false;

    await startScanner();
}

async function startScanner() {
    if (scannerStarting || scannerClosing) return;

    if (typeof Html5Qrcode === "undefined") {
        updateScannerStatus("Libreria scanner non caricata.");
        return;
    }

    scannerStarting = true;

    try {
        await disposeScanner();

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

        updateScannerStatus("Avvio fotocamera...");

        await scanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: (width, height) => ({
                    width: Math.floor(width * 0.85),
                    height: Math.max(100, Math.floor(height * 0.3))
                }),
                aspectRatio: 1.7778
            },
            onScanSuccess,
            () => {}
        );

        updateScannerStatus("Inquadra il codice a barre.");
    } catch (error) {
        console.error("Errore scanner:", error);
        updateScannerStatus(
            "Fotocamera non disponibile. Concedi il permesso e usa HTTPS o localhost."
        );
        await disposeScanner();
    } finally {
        scannerStarting = false;
    }
}

async function onScanSuccess(decodedText) {
    if (scannerLocked) return;

    const barcode = String(decodedText || "").trim();
    if (!barcode) return;

    scannerLocked = true;
    await closeScanner();

    setField("productBarcode", barcode);
    await lookupOpenFoodFacts(barcode);
}

function updateScannerStatus(message) {
    const status = $("scannerStatus");
    if (status) status.textContent = message;
}

async function disposeScanner() {
    if (!scanner) return;

    const instance = scanner;
    scanner = null;

    try {
        if (typeof instance.isScanning === "function" && instance.isScanning()) {
            await instance.stop();
        }
    } catch (error) {
        console.warn("Arresto scanner:", error);
    }

    try {
        await instance.clear();
    } catch (_) {}
}

async function closeScanner() {
    if (scannerClosing) return;
    scannerClosing = true;

    try {
        await disposeScanner();

        const modal = $("scannerModal");
        if (modal) {
            modal.classList.remove("active");
            modal.style.display = "none";
            modal.setAttribute("aria-hidden", "true");
        }

        scannerLocked = false;
    } finally {
        scannerClosing = false;
    }
}

/* =========================================
   RICERCA OPEN FOOD FACTS
   ========================================= */

async function lookupOpenFoodFacts(barcode) {
    try {
        showToast("Ricerca prodotto...");

        const response = await fetch(
            "https://world.openfoodfacts.org/api/v2/product/" +
            encodeURIComponent(barcode) + ".json"
        );

        if (!response.ok) throw new Error("Richiesta non riuscita.");

        const data = await response.json();

        openProductModal();

        setField("productBarcode", barcode);

        if (data.status === 1 && data.product) {
            const product = data.product;

            setField("productName", product.product_name || "");
            setField("productBrand", product.brands || "");
            setField(
                "productFormat",
                product.quantity || ""
            );

            setField(
                "productImage",
                product.image_front_url || product.image_url || ""
            );

            setField("productCategory", inferCategory(product));
            showToast("Dati prodotto recuperati.");
        } else {
            showToast("Prodotto non trovato: inserisci i dati manualmente.");
        }
    } catch (error) {
        console.error("Errore Open Food Facts:", error);
        openProductModal();
        setField("productBarcode", barcode);
        showToast("Ricerca online non riuscita. Inserisci i dati manualmente.");
    }
}

function inferCategory(product) {
    const text = [
        product.categories || "",
        Array.isArray(product.categories_tags)
            ? product.categories_tags.join(" ")
            : "",
        product.product_name || ""
    ].join(" ").toLowerCase();

    if (/shampoo|sapone|dentifricio|bagnoschiuma|deodorante|crema corpo|toothpaste/.test(text)) {
        return "bagno";
    }

    if (/detersivo|candeggina|ammorbidente|sgrassatore|detergente pavimenti|cleaner|laundry/.test(text)) {
        return "pulizia";
    }

    return "cibo";
}
document.addEventListener("DOMContentLoaded", function () {
    console.log("La Mia Dispensa: JavaScript caricato");

    const button = document.getElementById("addProductBtn");

    console.log("Pulsante aggiungi:", button);

    if (button) {
        button.addEventListener("click", function () {
            console.log("Pulsante Aggiungi premuto");

            if (typeof openProductModal === "function") {
                openProductModal();
            } else {
                alert("Errore: funzione openProductModal non disponibile.");
            }
        });
    }
});
