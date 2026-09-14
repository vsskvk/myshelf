const button = document.getElementById("addButton");
const form = document.getElementById("addForm");

const titleInput = document.getElementById("titleInput");
const typeSelect = document.getElementById("typeSelect");
const statusSelect = document.getElementById("statusSelect");
const ratingInput = document.getElementById("ratingInput");

const saveButton = document.getElementById("saveButton");
const randomButton = document.getElementById("randomButton");
const randomResult = document.getElementById("randomResult");

const cardsContainer = document.getElementById("cardsContainer");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const progressCount = document.getElementById("progressCount");
const plannedCount = document.getElementById("plannedCount");

const completedPercent = document.getElementById("completedPercent");
const progressPercent = document.getElementById("progressPercent");
const plannedPercent = document.getElementById("plannedPercent");
const collectionCount = document.getElementById("collectionCount");

const filterType = document.getElementById("filterType");
const filterStatus = document.getElementById("filterStatus");

const sidebarFilterItems = document.querySelectorAll(".nav-item[data-filter-type][data-filter-status]");

const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const randomType = document.getElementById("randomType");
const randomStatus = document.getElementById("randomStatus");

const formTitle = document.getElementById("formTitle");

const cancelButton = document.getElementById("cancelButton")

let editingItemId = null;
let searchTimer = null;

function closeForm() {
    form.style.display = "none";
    editingItemId = null;
}

cancelButton.addEventListener(
    "click",
    closeForm
)

function getTypeName(type) {
    if (type === 'game') {
        return "Игра";
    }

    if (type === 'movie') {
        return "Фильм";
    }

    if (type === 'book') {
        return "Книга";
    }
}

function getStatusName(status) {
    if (status === "planned") {
        return "В планах";
    }
    if (status === "in_progress") {
        return "В процессе";
    }
    if (status === "completed") {
        return "Завершено";
    }

    return "Не указан"
}

function createCard(item) {
    const card = document.createElement("article");
    card.classList.add("card");

    const cover = document.createElement("div");
    cover.classList.add("card-cover");
    cover.textContent = item.title;

    const cardInfo = document.createElement("div");
    cardInfo.classList.add("card-info");

    const cardHeader = document.createElement("div");
    cardHeader.classList.add("card-header");

    const title = document.createElement("h3");
    title.classList.add("card-title");
    title.textContent = item.title;

    const topActions = document.createElement("div");
    topActions.classList.add("card-actions-top");

    const favoriteButton = document.createElement("button");
    favoriteButton.classList.add("favorite-button");
    favoriteButton.textContent = "♡";

    const moreButton = document.createElement("button");
    moreButton.classList.add("more-button");
    moreButton.textContent = "⋮";

    const typeBadge = document.createElement("div");
    typeBadge.classList.add("type-badge", item.type);
    typeBadge.textContent = getTypeName(item.type);

    const statusBadge = document.createElement("div");
    statusBadge.classList.add("status-badge", item.status);
    statusBadge.textContent = getStatusName(item.status);

    const rating = document.createElement("div");
    rating.classList.add("rating");

    const ratingLabel = document.createElement("span");
    ratingLabel.classList.add("rating-label");
    ratingLabel.textContent = "Оценка";

    const ratingValue = document.createElement("div");
    ratingValue.classList.add("rating-value");

    if (item.rating === null) {
        ratingValue.textContent = "- / 10";
    } else {
        ratingValue.textContent = "★ " + item.rating + " / 10"
    }

    const editButton = document.createElement("button");
    editButton.classList.add("edit-button");
    editButton.textContent = "✎";

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button")
    deleteButton.textContent = "🗑";

    editButton.addEventListener(
        "click",
        function() {
            editingItemId = item.id;

            titleInput.value = item.title;
            typeSelect.value = item.type;
            statusSelect.value = item.status;

            if (item.rating === null) {
                ratingInput.value = "";
            } else {
                ratingInput.value = item.rating;
            }

            formTitle.textContent = "Редактировать элемент";

            saveButton.textContent = "Сохранить изменения";

            form.style.display = "flex";
        }
    );

    deleteButton.addEventListener(
        "click",
        async function() {
            const response = await fetch(
                "http://127.0.0.1:8000/items/" + item.id,
                {
                    method: "DELETE"
                }
            );

            if (response.ok) {
                await loadItems();
                await loadStats();
            }
        }
    );

    const cardFooter = document.createElement("div");
    cardFooter.classList.add("card-footer");

    topActions.appendChild(favoriteButton);
    topActions.appendChild(moreButton);

    cardHeader.appendChild(title);
    cardHeader.appendChild(topActions);

    rating.appendChild(ratingLabel);
    rating.appendChild(ratingValue);

    cardFooter.appendChild(editButton);
    cardFooter.appendChild(deleteButton);

    cardInfo.appendChild(cardHeader);
    cardInfo.appendChild(typeBadge);
    cardInfo.appendChild(statusBadge);
    cardInfo.appendChild(rating);
    cardInfo.appendChild(cardFooter);

    card.appendChild(cover);
    card.appendChild(cardInfo);

    cardsContainer.appendChild(card);
}

async function loadItems() {
    showCardsMessage("Загрузка...")

    const params = new URLSearchParams();
    const search = searchInput.value.trim();

    if (search !== "") {
        params.append(
            "search",
            search
        );
    }

    if (filterType.value !== "all") {
        params.append(
            "type", 
            filterType.value
        );
    }

    if (filterStatus.value !== "all") {
        params.append(
            "status", 
            filterStatus.value
        );
    }

    if (sortSelect.value !== "default") {
        params.append(
            "sort", 
            sortSelect.value
        );
    }

    let url = "http://127.0.0.1:8000/items";
    const queryString = params.toString();

    if (queryString !== "") {
        url += "?" + queryString;
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("HTTP ошибка: " + response.status);
        }

        const items = await response.json();

        cardsContainer.innerHTML = "";

        if (items.length === 0) {
            showCardsMessage("Ничего не найдено");
            return;
        }

        items.forEach(
            function(item) {
                createCard(item);
            }
        )
    } catch (error){
        console.error(error);
        showCardsMessage("Не удалось загрузить коллекцию");
    }
}

function updateStats(items) {
    const total = items.length;

    const completedItems = items.filter(
        function(item) {
            return item.status === "completed";
        }
    );

    const progressItems = items.filter(
        function(item) {
            return item.status === "in_progress";
        }
    );

    const plannedItems = items.filter(
        function(item) {
            return item.status === "planned";
        }
    );

    totalCount.textContent = total;
    collectionCount.textContent = total;

    completedCount.textContent = completedItems.length;
    progressCount.textContent = progressItems.length;
    plannedCount.textContent = plannedItems.length;

    if (total === 0) {
        completedPercent.textContent = "0% коллекции";
        progressPercent.textContent = "0% коллекции";
        plannedPercent.textContent = "0% коллекции";

        return;
    }

    const completedPercentage = Math.round(completedItems.length / total * 100);
    const progressPercentage = Math.round(progressItems.length / total * 100);
    const plannedPercentage = Math.round(plannedItems.length / total * 100);

    completedPercent.textContent = completedPercentage + "% коллекции";
    progressPercent.textContent = progressPercentage + "% коллекции";
    plannedPercent.textContent = plannedPercentage + "% коллекции";
}

async function loadStats() {
    const response = await fetch("http://127.0.0.1:8000/items");
    const items = await response.json();

    updateStats(items);    
}

sidebarFilterItems.forEach(
    function(navItem) {
        navItem.addEventListener(
            "click",
            function(event) {
                event.preventDefault();

                const type = navItem.dataset.filterType;
                const status = navItem.dataset.filterStatus;

                filterType.value = type;
                filterStatus.value = status;

                searchInput.value = "";

                updateSidebarActive();
                loadItems();
            }
        );
    }
);

function showCardsMessage(text) {
    cardsContainer.innerHTML = "";

    const message = document.createElement("div");

    message.classList.add("cards-message");
    message.textContent = text;

    cardsContainer.appendChild(message);
}

loadItems();
loadStats();

randomButton.addEventListener(
    "click",
    async function() {
        randomResult.textContent = "Выбираю ...";

        const params = new URLSearchParams();

        if (randomType.value !== "all") {
            params.append("type", randomType.value);
        }

        if (randomStatus.value !== "all") {
            params.append("status", randomStatus.value);
        }

        let url = "http://127.0.0.1:8080/random";

        const queryString = params.toString();

        if (queryString !== "") {
            url += "?" + queryString;
        }

        const response = await fetch(url);

        if (!response.ok) {
            randomResult.textContent = "Ничего подходящего не найдено";
            return
        }

        const item = await response.json();

        randomResult.textContent = "Сегодня: " + item.title + " - " + getTypeName(item.type);
    }
);

function updateSidebarActive() {
    sidebarFilterItems.forEach(
        function(navItem) {
            const typeMatches = navItem.dataset.filterType === filterType.value;
            const statusMatches = navItem.dataset.filterStatus === filterStatus.value;

            if (typeMatches && statusMatches) {
                navItem.classList.add("active");
            } else {
                navItem.classList.remove("active");
            }
        }
    );
}

filterType.addEventListener(
    "change",
    function() {
        updateSidebarActive();
        loadItems();
    }
);

filterStatus.addEventListener(
    "change",
    function() {
        updateSidebarActive();
        loadItems();
    }
);

sortSelect.addEventListener(
    "change",
    function() {
        loadItems();
    }
);

searchInput.addEventListener(
    "input",
    function() {
        clearTimeout(searchTimer);

        searchTimer = setTimeout(
            function() {
                loadItems();
            },
            400
        );
    }
);

button.addEventListener(
    "click", 
    function() {
        editingItemId = null;

        titleInput.value = "";
        typeSelect.value = "game";
        statusSelect.value = "planned";
        ratingInput.value = "";

        formTitle.textContent = "Добавить в коллекцию";

        saveButton.textContent = "Сохранить";

        form.style.display = "flex";
    }
);

saveButton.addEventListener(
    'click',
    async function() {
        const title = titleInput.value;
        const type = typeSelect.value;
        const status = statusSelect.value;
        const ratingValue = ratingInput.value;

        if (title === "") {
            alert("Введите название");
            return;
        }

        let rating = null;
        if (ratingValue !== "") {
            rating = Number(ratingValue);
        }
        if (rating !== null) {
            if (rating < 1 || rating > 10) {
                alert("Оценка должна быть от 1 до 10");
                return;
            }
        }

        const item = {
            title: title,
            type: type,
            status: status,
            rating: rating
        };

        let url = "http://127.0.0.1:8000/items";
        let method = "POST"

        if (editingItemId !== null) {
            url = "http://127.0.0.1:8000/items/" + editingItemId;
            method = "PUT"
        }

        const response = await fetch(
            url,
            {
                method: method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(item)
            }
        );

        if (!response.ok) {
            alert("Не удалось сохранить");
            return;
        }

        titleInput.value = "";
        typeSelect.value = "game";
        statusSelect.value = "planned";
        ratingInput.value = "";

        closeForm();

        saveButton.textContent = "Сохранить";

        await loadItems();
        await loadStats();
    }
);

document.addEventListener(
    "click",
    function(event) {
        const clickedInsideForm = form.contains(event.target);
        const clickedAddButton = button.contains(event.target);

        if (!clickedInsideForm && !clickedAddButton) {
            closeForm();
        }
    }
);

document.addEventListener(
    "keydown",
    function(event) {
        if (event.key === "Escape") {
            closeForm();
        }
    }
);