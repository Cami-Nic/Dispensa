var STORAGE_KEY = "laMiaDispensaProdotti";

var products = [];

var currentCategory = "cibo";
var currentFilter = "all";
var currentDispensa = null;

var editingProductId = null;

var html5QrCode = null;

var scannerStarting = false;
var scannerRunning = false;
var scannerLocked = false;

var toastTimer = null;


/* =========================
   CATEGORY DATA
========================= */

var categoryData = {

    cibo: {
        title: "Cibo",
        subtitle: "Dispensa e alimentari",
        icon: "🍎"
    },

    bagno: {
        title: "Prodotti bagno",
        subtitle: "Cura personale",
        icon: "🧴"
    },

    pulizia: {
        title: "Prodotti pulizia",
        subtitle: "Pulizia della casa",
        icon: "🧹"
    }

};


/* =========================
   INITIAL DATA
========================= */

var seedProducts = [

    {
        id: "seed-1",
        name: "Pasta",
        brand: "Barilla",
        format: "500 g",
        quantity: 3,
        minStock: 2,
        category: "cibo",
        barcode: "",
        image: ""
    },

    {
        id: "seed-2",
        name: "Latte",
        brand: "Parmalat",
        format: "1 L",
        quantity: 1,
        minStock: 2,
        category: "cibo",
        barcode: "",
        image: ""
    },

    {
        id: "seed-3",
        name: "Shampoo",
        brand: "Pantene",
        format: "250 ml",
        quantity: 2,
        minStock: 1,
        category: "bagno",
        barcode: "",
        image: ""
    },

    {
        id: "seed-4",
        name: "Detersivo piatti",
        brand: "Nelsen",
        format: "900 ml",
        quantity: 1,
        minStock: 1,
        category: "pulizia",
        barcode: "",
        image: ""
    }

];


/* =========================
   INIT
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadProducts();

        renderCategoryCards();

        showScreen("homeScreen");

    }
);


/* =========================
   LOCAL STORAGE
========================= */

function loadProducts() {

    try {

        var saved =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (saved) {

            products =
                JSON.parse(saved);

        } else {

            products =
                seedProducts.slice();

            saveProducts();

        }

    } catch (error) {

        products =
            seedProducts.slice();

    }

}


function saveProducts() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(products)
    );

}


/* =========================
   SCREEN NAVIGATION
========================= */

function showScreen(screenId) {

    var screens =
        document.querySelectorAll(
            ".screen"
        );

    for (
        var i = 0;
        i < screens.length;
        i++
    ) {

        screens[i]
            .classList
            .remove("active");

    }


    var screen =
        document.getElementById(
            screenId
        );

    if (screen) {

        screen
            .classList
            .add("active");

    }


    window.scrollTo(0, 0);

}


function goHome() {

    showScreen(
        "homeScreen"
    );

}


function openDispensa(type) {

    currentDispensa = type;

    var title =
        document.getElementById(
            "dispensaTitle"
        );

    if (type === "casa") {

        title.textContent =
            "Dispensa Casa";

    } else {

        title.textContent =
            "Dispensa Cantina";

    }

    renderCategoryCards();

    showScreen(
        "dispensaScreen"
    );

}
function backToDispensa() {

    showScreen(
        "dispensaScreen"
    );

}


/* =========================
   CATEGORY CARDS
========================= */

function renderCategoryCards() {

    var container =
        document.getElementById(
            "categoryCards"
        );

    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    var categories = [];


    if (
        currentDispensa ===
        "cantina"
    ) {

        categories = [
            "pulizia"
        ];

    } else {

        categories = [
            "cibo",
            "bagno"
        ];

    }


    for (
        var i = 0;
        i < categories.length;
        i++
    ) {

        var category =
            categories[i];

        var data =
            categoryData[
                category
            ];


        var button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "category-card " +
            category;


        button.onclick =
            (function (
                selectedCategory
            ) {

                return function () {

                    openCategory(
                        selectedCategory
                    );

                };

            })(category);


        var icon =
            document.createElement(
                "div"
            );

        icon.className =
            "category-icon";

        icon.textContent =
            data.icon;


        var title =
            document.createElement(
                "div"
            );

        title.className =
            "category-title";

        title.textContent =
            data.title;


        var subtitle =
            document.createElement(
                "div"
            );

        subtitle.className =
            "category-subtitle";

        subtitle.textContent =
            data.subtitle;


        button.appendChild(
            icon
        );

        button.appendChild(
            title
        );

        button.appendChild(
            subtitle
        );


        container.appendChild(
            button
        );

    }

}


/* =========================
   OPEN CATEGORY
========================= */

function openCategory(
    category
) {

    currentCategory =
        category;

    currentFilter =
        "all";


    var data =
        categoryData[
            category
        ];


    document.getElementById(
        "categoryTitle"
    ).textContent =
        data.title;


    document.getElementById(
        "categorySubtitle"
    ).textContent =
        data.subtitle;


    document.getElementById(
        "searchInput"
    ).value =
        "";


    updateFilterButtons();

    renderProducts();

    showScreen(
        "categoryScreen"
    );

}


/* =========================
   LOW STOCK
========================= */

function isLowStock(
    product
) {

    return Number(
        product.quantity
    ) <
    Number(
        product.minStock
    );

}


/* =========================
   PRODUCTS
========================= */

function renderProducts() {

    var container =
        document.getElementById(
            "productsList"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    var searchInput =
        document.getElementById(
            "searchInput"
        );


    var search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    var filtered = [];


    for (
        var i = 0;
        i < products.length;
        i++
    ) {

        var product =
            products[i];


        if (
            product.category !==
            currentCategory
        ) {
            continue;
        }


        if (
            currentFilter === "low" &&
            !isLowStock(product)
        ) {
            continue;
        }


        if (search) {

            var searchable =
                (
                    (product.name || "") +
                    " " +
                    (product.brand || "") +
                    " " +
                    (product.format || "") +
                    " " +
                    (product.barcode || "")
                )
                .toLowerCase();


            if (
                searchable.indexOf(
                    search
                ) === -1
            ) {

                continue;

            }

        }


        filtered.push(
            product
        );

    }


    if (
        filtered.length === 0
    ) {

        var empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty-state";


        empty.innerHTML =
            '<div class="empty-icon">📦</div>' +
            '<div class="empty-title">Nessun prodotto</div>' +
            '<div class="empty-text">' +
            'Non ci sono prodotti da visualizzare.' +
            '</div>';


        container.appendChild(
            empty
        );

        return;

    }


    for (
        var j = 0;
        j < filtered.length;
        j++
    ) {

        container.appendChild(
            createProductCard(
                filtered[j]
            )
        );

    }

}


function createProductCard(
    product
) {

    var card =
        document.createElement(
            "div"
        );

    card.className =
        "product-card";


    var imageContainer =
        document.createElement(
            "div"
        );

    imageContainer.className =
        "product-image";


    if (product.image) {

        var image =
            document.createElement(
                "img"
            );

        image.src =
            product.image;

        image.alt =
            product.name ||
            "Prodotto";


        image.onerror =
            function () {

                image.style.display =
                    "none";


                if (
                    !imageContainer
                        .querySelector(
                            ".product-image-placeholder"
                        )
                ) {

                    var placeholder =
                        document.createElement(
                            "div"
                        );

                    placeholder.className =
                        "product-image-placeholder";

                    placeholder.textContent =
                        "📦";


                    imageContainer
                        .appendChild(
                            placeholder
                        );

                }

            };


        imageContainer.appendChild(
            image
        );

    } else {

        var placeholder =
            document.createElement(
                "div"
            );

        placeholder.className =
            "product-image-placeholder";

        placeholder.textContent =
            "📦";


        imageContainer.appendChild(
            placeholder
        );

    }


    var info =
        document.createElement(
            "div"
        );

    info.className =
        "product-info";


    var name =
        document.createElement(
            "div"
        );

    name.className =
        "product-name";

    name.textContent =
        product.name ||
        "Prodotto";


    var brand =
        document.createElement(
            "div"
        );

    brand.className =
        "product-brand";

    brand.textContent =
        product.brand ||
        "Marca non specificata";


    var format =
        document.createElement(
            "div"
        );

    format.className =
        "product-format";

    format.textContent =
        product.format ||
        "";


    var bottom =
        document.createElement(
            "div"
        );

    bottom.className =
        "product-bottom";


    var quantity =
        document.createElement(
            "span"
        );

    quantity.className =
        "quantity";

    quantity.textContent =
        "Quantità: " +
        Number(
            product.quantity || 0
        );


    bottom.appendChild(
        quantity
    );


    if (
        isLowStock(product)
    ) {

        var lowStock =
            document.createElement(
                "span"
            );

        lowStock.className =
            "low-stock";

        lowStock.textContent =
            "SCORTE BASSE";


        bottom.appendChild(
            lowStock
        );

    }


    info.appendChild(
        name
    );

    info.appendChild(
        brand
    );

    info.appendChild(
        format
    );

    info.appendChild(
        bottom
    );


    var editButton =
        document.createElement(
            "button"
        );

    editButton.type =
        "button";

    editButton.className =
        "edit-product-button";

    editButton.textContent =
        "✎";


    editButton.setAttribute(
        "aria-label",
        "Modifica prodotto"
    );


    editButton.onclick =
        function () {

            openProductModal(
                product.id
            );

        };


    card.appendChild(
        imageContainer
    );

    card.appendChild(
        info
    );

    card.appendChild(
        editButton
    );


    return card;

}


/* =========================
   FILTER
========================= */

function setFilter(
    filter
) {

    currentFilter =
        filter;


    updateFilterButtons();

    renderProducts();

}


function updateFilterButtons() {

    var all =
        document.getElementById(
            "filterAll"
        );

    var low =
        document.getElementById(
            "filterLow"
        );


    if (all) {

        all.classList.toggle(
            "active",
            currentFilter === "all"
        );

    }


    if (low) {

        low.classList.toggle(
            "active",
            currentFilter === "low"
        );

    }

}


/* =========================
   PRODUCT MODAL
========================= */

function openProductModal(
    productId
) {

    editingProductId =
        productId || null;


    var modal =
        document.getElementById(
            "productModal"
        );


    var title =
        document.getElementById(
            "productModalTitle"
        );


    var deleteButton =
        document.getElementById(
            "deleteProductButton"
        );


    if (editingProductId) {

        var product =
            findProductById(
                editingProductId
            );


        if (!product) {
            return;
        }


        title.textContent =
            "Modifica prodotto";


        deleteButton.style.display =
            "block";


        document.getElementById(
            "productName"
        ).value =
            product.name || "";


        document.getElementById(
            "productBrand"
        ).value =
            product.brand || "";


        document.getElementById(
            "productFormat"
        ).value =
            product.format || "";


        document.getElementById(
            "productQuantity"
        ).value =
            Number(
                product.quantity || 0
            );


        document.getElementById(
            "productMinStock"
        ).value =
            Number(
                product.minStock || 0
            );


        document.getElementById(
            "productCategory"
        ).value =
            product.category ||
            currentCategory;


        document.getElementById(
            "productBarcode"
        ).value =
            product.barcode || "";


        document.getElementById(
            "productImage"
        ).value =
            product.image || "";

    } else {

        title.textContent =
            "Nuovo prodotto";


        deleteButton.style.display =
            "none";


        document.getElementById(
            "productName"
        ).value =
            "";


        document.getElementById(
            "productBrand"
        ).value =
            "";


        document.getElementById(
            "productFormat"
        ).value =
            "";


        document.getElementById(
            "productQuantity"
        ).value =
            "1";


        document.getElementById(
            "productMinStock"
        ).value =
            "1";


        document.getElementById(
            "productCategory"
        ).value =
            currentCategory;


        document.getElementById(
            "productBarcode"
        ).value =
            "";


        document.getElementById(
            "productImage"
        ).value =
            "";

    }


    modal.classList.add(
        "active"
    );

}


function closeProductModal() {

    document
        .getElementById(
            "productModal"
        )
        .classList.remove(
            "active"
        );


    editingProductId =
        null;

}


function closeModalOutside(
    event,
    modalId
) {

    if (
        event.target.id ===
        modalId
    ) {

        if (
            modalId ===
            "productModal"
        ) {

            closeProductModal();

        }


        if (
            modalId ===
            "scannerModal"
        ) {

            closeScanner();

        }

    }

}


/* =========================
   SAVE PRODUCT
========================= */

function saveProduct() {

    var name =
        document.getElementById(
            "productName"
        ).value.trim();


    if (!name) {

        showToast(
            "Inserisci il nome del prodotto"
        );

        return;

    }


    var product = {

        name: name,

        brand:
            document.getElementById(
                "productBrand"
            ).value.trim(),

        format:
            document.getElementById(
                "productFormat"
            ).value.trim(),

        quantity:
            Number(
                document.getElementById(
                    "productQuantity"
                ).value || 0
            ),

        minStock:
            Number(
                document.getElementById(
                    "productMinStock"
                ).value || 0
            ),

        category:
            document.getElementById(
                "productCategory"
            ).value,

        barcode:
            document.getElementById(
                "productBarcode"
            ).value.trim(),

        image:
            document.getElementById(
                "productImage"
            ).value.trim()

    };


    if (editingProductId) {

        var existing =
            findProductById(
                editingProductId
            );


        if (existing) {

            existing.name =
                product.name;

            existing.brand =
                product.brand;

            existing.format =
                product.format;

            existing.quantity =
                product.quantity;

            existing.minStock =
                product.minStock;

            existing.category =
                product.category;

            existing.barcode =
                product.barcode;

            existing.image =
                product.image;

        }


        showToast(
            "Prodotto aggiornato"
        );

    } else {

        product.id =
            createId();


        products.push(
            product
        );


        showToast(
            "Prodotto aggiunto"
        );

    }


    saveProducts();

    closeProductModal();

    renderProducts();

}


/* =========================
   DELETE PRODUCT
========================= */

function deleteProduct() {

    if (!editingProductId) {
        return;
    }


    var confirmed =
        window.confirm(
            "Vuoi eliminare questo prodotto?"
        );


    if (!confirmed) {
        return;
    }


    var newProducts = [];


    for (
        var i = 0;
        i < products.length;
        i++
    ) {

        if (
            products[i].id !==
            editingProductId
        ) {

            newProducts.push(
                products[i]
            );

        }

    }


    products =
        newProducts;


    saveProducts();

    closeProductModal();

    renderProducts();

    showToast(
        "Prodotto eliminato"
    );

}


/* =========================
   FIND PRODUCT
========================= */

function findProductById(
    id
) {

    for (
        var i = 0;
        i < products.length;
        i++
    ) {

        if (
            products[i].id ===
            id
        ) {

            return products[i];

        }

    }


    return null;

}


/* =========================
   ID
========================= */

function createId() {

    return (
        "product-" +
        Date.now() +
        "-" +
        Math.floor(
            Math.random() * 100000
        )
    );

}


/* =========================
   SCANNER
========================= */

function openScanner() {

    var modal =
        document.getElementById(
            "scannerModal"
        );


    var status =
        document.getElementById(
            "scannerStatus"
        );


    modal.classList.add(
        "active"
    );


    status.textContent =
        "Avvio fotocamera...";


    scannerLocked =
        false;


    startScanner();

}


async function startScanner() {

    if (
        scannerStarting ||
        scannerRunning
    ) {

        return;

    }


    scannerStarting =
        true;


    try {

        html5QrCode =
            new Html5Qrcode(
                "reader"
            );


        /*
            Prima scelta:
            fotocamera frontale.
        */

        try {

            await html5QrCode.start(

                {
                    facingMode:
                        "user"
                },

                {
                    fps: 10,

                    qrbox: {
                        width: 250,
                        height: 150
                    }
                },

                onScanSuccess,

                onScanFailure

            );


            scannerRunning =
                true;


            updateScannerStatus(
                "Inquadra il codice a barre"
            );


            scannerStarting =
                false;


            return;

        } catch (
            frontError
        ) {

            console.log(
                "Fotocamera frontale non disponibile",
                frontError
            );

        }


        /*
            Fallback:
            cerca una fotocamera
            frontale.
        */

        var cameras =
            await Html5Qrcode
                .getCameras();


        if (
            !cameras ||
            cameras.length === 0
        ) {

            throw new Error(
                "Nessuna fotocamera disponibile"
            );

        }


        var selectedCamera =
            cameras[0];


        for (
            var i = 0;
            i < cameras.length;
            i++
        ) {

            var label =
                (
                    cameras[i].label ||
                    ""
                ).toLowerCase();


            if (
                label.indexOf(
                    "front"
                ) !== -1 ||

                label.indexOf(
                    "facetime"
                ) !== -1 ||

                label.indexOf(
                    "user"
                ) !== -1
            ) {

                selectedCamera =
                    cameras[i];

                break;

            }

        }


        await html5QrCode.start(

            selectedCamera.id,

            {
                fps: 10,

                qrbox: {
                    width: 250,
                    height: 150
                }
            },

            onScanSuccess,

            onScanFailure

        );


        scannerRunning =
            true;


        updateScannerStatus(
            "Inquadra il codice a barre"
        );


    } catch (error) {

        console.error(
            "Errore scanner:",
            error
        );


        updateScannerStatus(
            "Impossibile avviare la fotocamera. Verifica i permessi."
        );

    }


    scannerStarting =
        false;

}


function onScanSuccess(
    decodedText
) {

    if (scannerLocked) {
        return;
    }


    scannerLocked =
        true;


    var barcode =
        String(
            decodedText || ""
        ).trim();


    document.getElementById(
        "productBarcode"
    ).value =
        barcode;


    updateScannerStatus(
        "Codice trovato: " +
        barcode
    );


    lookupOpenFoodFacts(
        barcode
    );

}


function onScanFailure(
    errorMessage
) {

    /*
        Errori di scansione
        ignorati intenzionalmente.
    */

}


function updateScannerStatus(
    message
) {

    var status =
        document.getElementById(
            "scannerStatus"
        );


    if (status) {

        status.textContent =
            message;

    }

}


async function closeScanner() {

    scannerLocked =
        true;


    if (
        html5QrCode &&
        scannerRunning
    ) {

        try {

            await html5QrCode.stop();

        } catch (
            error
        ) {

            console.log(
                "Errore stop scanner",
                error
            );

        }

    }


    if (html5QrCode) {

        try {

            await html5QrCode.clear();

        } catch (
            error
        ) {

            console.log(
                "Errore clear scanner",
                error
            );

        }

    }


    html5QrCode =
        null;


    scannerRunning =
        false;

    scannerStarting =
        false;


    document
        .getElementById(
            "scannerModal"
        )
        .classList.remove(
            "active"
        );

}


/* =========================
   OPEN FOOD FACTS
========================= */

async function lookupOpenFoodFacts(
    barcode
) {

    if (!barcode) {
        return;
    }


    updateScannerStatus(
        "Cerco informazioni sul prodotto..."
    );


    try {

        var response =
            await fetch(
                "https://world.openfoodfacts.org/api/v2/product/" +
                encodeURIComponent(
                    barcode
                ) +
                ".json"
            );


        var data =
            await response.json();


        if (
            data &&
            data.status === 1 &&
            data.product
        ) {

            var product =
                data.product;


            var productName =
                product.product_name ||
                product.product_name_it ||
                "";


            var brand =
                product.brands ||
                "";


            var quantity =
                product.quantity ||
                "";


            var image =
                product.image_front_url ||
                product.image_url ||
                "";


            if (productName) {

                document.getElementById(
                    "productName"
                ).value =
                    productName;

            }


            if (brand) {

                document.getElementById(
                    "productBrand"
                ).value =
                    brand;

            }


            if (quantity) {

                document.getElementById(
                    "productFormat"
                ).value =
                    quantity;

            }


            if (image) {

                document.getElementById(
                    "productImage"
                ).value =
                    image;

            }


            updateScannerStatus(
                "Prodotto trovato!"
            );


            setTimeout(
                function () {

                    closeScanner();

                    openProductModal();

                },
                700
            );


        } else {

            updateScannerStatus(
                "Codice trovato, ma prodotto non presente."
            );


            setTimeout(
                function () {

                    closeScanner();

                    openProductModal();

                },
                900
            );

        }


    } catch (
        error
    ) {

        console.error(
            "Errore Open Food Facts:",
            error
        );


        updateScannerStatus(
            "Codice letto. Inserisci i dati manualmente."
        );


        setTimeout(
            function () {

                closeScanner();

                openProductModal();

            },
            900
        );

    }

}


/* =========================
   TOAST
========================= */

function showToast(
    message
) {

    var toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    if (toastTimer) {

        clearTimeout(
            toastTimer
        );

    }


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}
