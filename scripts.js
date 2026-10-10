
/* =====================================
   LA MIA DISPENSA
   Navigazione tra le schermate
===================================== */

document.addEventListener("DOMContentLoaded", () => {
    const homeScreen = document.getElementById("homeScreen");
    const dispensaScreen = document.getElementById("dispensaScreen");
    const categoryScreen = document.getElementById("categoryScreen");

    const dispensaTitle = document.getElementById("dispensaTitle");
    const categoryTitle = document.getElementById("categoryTitle");
    const categorySubtitle = document.getElementById("categorySubtitle");
    const categoryCards = document.getElementById("categoryCards");

    let dispensaCorrente = "casa";

    const categorie = {
        casa: [
            {
                id: "cibo",
                titolo: "Cibo",
                sottotitolo: "Dispensa e alimentari",
                icona: "🥫"
            },
            {
                id: "bagno",
                titolo: "Prodotti bagno",
                sottotitolo: "Igiene e cura personale",
                icona: "🧴"
            }
        ],

        cantina: [
            {
                id: "pulizia",
                titolo: "Prodotti pulizia",
                sottotitolo: "Detersivi e pulizia della casa",
                icona: "🧹"
            }
        ]
    };

    // Mostra una sola schermata alla volta
    function mostraSchermata(schermata) {
        document.querySelectorAll(".screen").forEach(elemento => {
            elemento.classList.remove("active");
        });

        schermata.classList.add("active");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // HOME -> DISPENSA
    window.openDispensa = function(tipo) {
        if (!categorie[tipo]) return;

        dispensaCorrente = tipo;

        dispensaTitle.textContent =
            tipo === "casa"
                ? "Dispensa Casa"
                : "Dispensa Cantina";

        mostraCategorie();
        mostraSchermata(dispensaScreen);
    };

    // DISPENSA -> HOME
    window.goHome = function() {
        mostraSchermata(homeScreen);
    };

    // Genera le schede delle categorie
    function mostraCategorie() {
        categoryCards.innerHTML = "";

        categorie[dispensaCorrente].forEach(categoria => {
            const scheda = document.createElement("button");

            scheda.type = "button";
            scheda.className = "category-card";

            const icona = document.createElement("div");
            icona.className = "category-card-icon";
            icona.textContent = categoria.icona;

            const titolo = document.createElement("div");
            titolo.className = "category-card-title";
            titolo.textContent = categoria.titolo;

            const sottotitolo = document.createElement("div");
            sottotitolo.className = "category-card-subtitle";
            sottotitolo.textContent = categoria.sottotitolo;

            const freccia = document.createElement("div");
            freccia.className = "category-card-arrow";
            freccia.textContent = "→";

            scheda.append(icona, titolo, sottotitolo, freccia);

            scheda.addEventListener("click", () => {
                apriCategoria(categoria);
            });

            categoryCards.appendChild(scheda);
        });
    }

    // DISPENSA -> CATEGORIA
    function apriCategoria(categoria) {
        categoryTitle.textContent = categoria.titolo;
        categorySubtitle.textContent = categoria.sottotitolo;

        // Memorizza la categoria attiva
        window.categoriaCorrente = categoria.id;

        // Aggiorna il filtro categoria del modulo prodotto,
        // se presente nella pagina.
        const selettore = document.getElementById("productCategory");

        if (selettore) {
            selettore.value = categoria.id;
        }

        mostraSchermata(categoryScreen);

        // Aggiorna l'elenco se esiste la funzione
        // nel JavaScript che gestisce i prodotti.
        if (typeof window.renderProducts === "function") {
            window.renderProducts();
        }
    }

    // CATEGORIA -> DISPENSA
    window.backToDispensa = function() {
        mostraSchermata(dispensaScreen);
    };

    // Avvio: mostra la Home
    mostraSchermata(homeScreen);
});
