// config
const API_BASE_URL = "http://127.0.0.1:8000";
const RANDOM_SERVICE_URL = "http://127.0.0.1:8080";

// data
const TYPE_NAMES = {
    game: "Игра",
    movie: "Фильм",
    book: "Книга"
};
const STATUS_NAMES = {
    planned: "В планах",
    in_progress: "В процессе",
    completed: "Завершено"
};
const FAVORITE_ICONS = {
    empty: "assets/icons/favorite-empty.png",
    filled: "assets/icons/favorite-filled.png"
};
const PAGE_CONFIG = {
    collection: {
        title: "Моя коллекция",
        subtitle: "Твоя коллекция фильмов, игр и книг в одном месте",
        collectionTitle: "Все элементы",
        icon: "assets/icons/header-collection.png",
        showStats: true,
        showActions: true
    },
    favorites: {
        title: "Избранное",
        subtitle: "Твои любимые фильмы, игры и книги",
        collectionTitle: "Избранные элементы",
        icon: "assets/icons/sidebar-favorite.png",
        showStats: false,
        showActions: false
    }
};

// helpers
function openPage(page) {
    const config = PAGE_CONFIG[page];

    if (!config) {
        return;
    }

    currentPage = page;
    navItems.forEach(
        function(navItem) {
            navItem.classList.toggle(
                "active",
                navItem.dataset.page === page
            );
        }
    );

    pageTitleText.textContent = config.title;
    pageSubtitle.textContent = config.subtitle;
    pageTitleIcon.src = config.icon;
    collectionTitle.textContent = config.collectionTitle;
    statsSection.style.display = config.showStats ? "flex" : "none";
    randomMenu.hidden = !config.showActions;
    addMenu.hidden = !config.showActions;

    loadItems();
}
function getTypeName(type) {
    return TYPE_NAMES[type] ?? "Неизвестный тип";
}
function getStatusName(status) {
    return STATUS_NAMES[status] ?? "Не указан";
}
function updateFavoriteButton(button, icon, isFavorite) {
    button.classList.toggle("active", isFavorite);

    icon.src = isFavorite
        ? FAVORITE_ICONS.filled
        : FAVORITE_ICONS.empty;

    button.setAttribute(
        "aria-label",
        isFavorite
        ? "Убрать из избранного"
        : "Добавить в избранное"
    );
}
function closeAllCardMenus(exceptMenu = null) {
    document.querySelectorAll(".card-menu.open").forEach(
        function(menu) {
            if (menu !== exceptMenu) {
                menu.classList.remove("open");
            }
        }
    );
}
function openDeleteConfirm(item) {
    pendingDeleteItem = item;

    deleteConfirmText.textContent = 'Удалить "' + item.title + '" из коллекции?';
    deleteConfirmModal.classList.add("open");
}
function closeDeleteConfirm() {
    pendingDeleteItem = null;

    deleteConfirmModal.classList.remove("open");
}

// add form
const addMenu = document.querySelector(".add-menu");
const addButton = document.getElementById("addButton");
const addForm = document.getElementById("addForm");
const formTitle = document.getElementById("formTitle");
const titleInput = document.getElementById("titleInput");
const typeSelect = document.getElementById("typeSelect");
const statusSelect = document.getElementById("statusSelect");
const ratingInput = document.getElementById("ratingInput");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

// random
const randomButton = document.getElementById("randomButton");
const randomAgainButton = document.getElementById("randomAgainButton");
const randomOpenButton = document.getElementById("randomOpenButton");
const randomResult = document.getElementById("randomResult");
const randomMenu = document.querySelector(".random-menu");
const randomCover = document.getElementById("randomCover");
const randomTitle = document.getElementById("randomTitle");
const randomTypeBadge = document.getElementById("randomTypeBadge");
const randomStatusBadge = document.getElementById("randomStatusBadge");
const randomRating = document.getElementById("randomRating");
const randomType = document.getElementById("randomType");
const randomStatus = document.getElementById("randomStatus");

// collection
const cardsContainer = document.getElementById("cardsContainer");
const collectionCount = document.getElementById("collectionCount");

// delete confirmation
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const deleteConfirmText = document.getElementById("deleteConfirmText");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");

// navigation
const navItems = document.querySelectorAll(".nav-item[data-page]");
const pageTitleText = document.getElementById("pageTitleText");
const pageSubtitle = document.getElementById("pageSubtitle");
const pageTitleIcon = document.querySelector(".page-title-icon");
const collectionTitle = document.getElementById("collectionTitle");
const statsSection = document.querySelector(".stats");

// filters
const filterType = document.getElementById("filterType");
const filterStatus = document.getElementById("filterStatus");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

// stats
const totalCount = document.getElementById("totalCount");
const weeklyCount = document.getElementById("weeklyCount");
const completedCount = document.getElementById("completedCount");
const progressCount = document.getElementById("progressCount");
const plannedCount = document.getElementById("plannedCount");
const completedPercent = document.getElementById("completedPercent");
const progressPercent = document.getElementById("progressPercent");
const plannedPercent = document.getElementById("plannedPercent");
const favoriteCount = document.getElementById("favoriteCount");
const favoritePercent = document.getElementById("favoritePercent");

// state
const customSelectRegistry = new Map();
let editingItemId = null;
let searchTimer = null;
let currentRandomItem = null;
let randomLoading = false;
let currentPage = "collection";
let pendingDeleteItem = null;

// custom select
function renderCustomSelectContent(container, nativeOption) {
    container.replaceChildren();

    const iconPath = nativeOption.dataset.icon;

    if (iconPath) {
        const icon = document.createElement("img");

        icon.src = iconPath;
        icon.alt = "";
        icon.classList.add("custom-select-option-icon");

        container.appendChild(icon);
    }

    const text = document.createElement("span");

    text.classList.add("custom-select-option-label");
    text.textContent = nativeOption.textContent.trim();

    container.appendChild(text);
}

function syncCustomSelect(select) {
    const component = customSelectRegistry.get(select);

    if (!component) {
        return;
    }

    const selectedOption = select.options[select.selectedIndex];

    if (selectedOption) {
        renderCustomSelectContent(component.value, selectedOption);
    }

    component.options.forEach(
        function(optionData) {
            const isSelected = optionData.nativeOption.selected;

            optionData.button.classList.toggle(
                    "selected",
                    isSelected
                );

            optionData.button.setAttribute(
                    "aria-selected",
                    String(isSelected)
                );
        }
    );
}

function setSelectValue(select, value, notify = false) {
    select.value = value;
    syncCustomSelect(select);

    if (notify) {
        select.dispatchEvent(
            new Event(
                "change",
                {bubbles: true}
            )
        );
    }
}

function closeCustomSelect(wrapper) {
    wrapper.classList.remove("open");

    const button = wrapper.querySelector(".custom-select-button");

    button.setAttribute(
        "aria-expanded",
        "false"
    );
}

function closeAllCustomSelects(exceptWrapper = null) {
    customSelectRegistry.forEach(
        function(component) {
            if (component.wrapper !== exceptWrapper) {
                closeCustomSelect(component.wrapper);
            }
        }
    );
}

function initCustomSelect(select) {
    if (customSelectRegistry.has(select)) {
        return;
    }

    const wrapper = document.createElement("div");
 
    wrapper.classList.add("custom-select");
    select.parentNode.insertBefore(wrapper, select);

    wrapper.appendChild(select);
    select.classList.add("custom-select-native");
    select.tabIndex = -1;

    const button = document.createElement("button");

    button.type = "button";
    button.classList.add("custom-select-button");
    button.setAttribute(
        "aria-haspopup",
        "listbox"
    );
    button.setAttribute(
        "aria-expanded",
        "false"
    );

    const value = document.createElement("span");
    value.classList.add("custom-select-value");

    const arrow = document.createElement("span");
    arrow.classList.add("custom-select-arrow");

    button.appendChild(value);
    button.appendChild(arrow);

    const menu = document.createElement("div");
    menu.classList.add("custom-select-menu");
    menu.setAttribute(
        "role",
        "listbox"
    );

    const optionDataList = [];

    Array.from(select.options).forEach(
        function(nativeOption) {
            const optionButton = document.createElement("button");
            optionButton.type = "button";
            optionButton.classList.add("custom-select-option");
            optionButton.setAttribute(
                "role",
                "option"
            );

            const optionContent = document.createElement("span");
            optionContent.classList.add("custom-select-option-content");
            renderCustomSelectContent(optionContent, nativeOption);

            const check = document.createElement("span");
            check.classList.add("custom-select-check");
            check.textContent = "✓";

            optionButton.appendChild(optionContent);
            optionButton.appendChild(check);

            if (nativeOption.disabled) {
                optionButton.disabled = true;
            }

            optionButton.addEventListener(
                "click",
                function() {
                    setSelectValue(
                        select,
                        nativeOption.value,
                        true
                    );
                    closeCustomSelect(wrapper);

                    button.focus();
                }
            );
            menu.appendChild(optionButton);

            optionDataList.push({
                button: optionButton,
                nativeOption: nativeOption
            });
        }
    );   
    wrapper.appendChild(button);
    wrapper.appendChild(menu);

    customSelectRegistry.set(
        select,
        {
            wrapper: wrapper,
            button: button,
            value: value,
            menu: menu,
            options: optionDataList
        }
    );
    syncCustomSelect(select);

    button.addEventListener(
        "click",
        function() {
            const shouldOpen = !wrapper.classList.contains("open");

            closeAllCustomSelects(wrapper);

            if (shouldOpen) {
                wrapper.classList.add("open");

                button.setAttribute(
                    "aria-expanded",
                    "true"
                );

                const selected = optionDataList.find(
                    function(optionData) {
                        return(optionData.nativeOption.selected);
                    }
                );

                if (selected) {
                    requestAnimationFrame(
                        function() {
                            selected.button.focus();
                        }
                    );
                }
            } else {
                closeCustomSelect(wrapper);
            }
        }
    );
    select.addEventListener(
        "change",
        function() {
            syncCustomSelect(select);
        }
    );
}

// form
function resetForm() {
    titleInput.value = "";
    setSelectValue(
        typeSelect,
        "game"
    );
    setSelectValue(
        statusSelect,
        "planned"
    );
    ratingInput.value = "";
}

function closeForm() {
    addForm.style.display = "none";
    editingItemId = null;
}

function openAddForm() {
    editingItemId = null;

    resetForm();

    formTitle.textContent = "Добавить элемент";
    saveButton.textContent = "Сохранить";

    addForm.style.display = "flex";
}

function openEditForm(item) {
    editingItemId = item.id;

    titleInput.value = item.title;
    setSelectValue(
        typeSelect,
        item.type
    );
    setSelectValue(
        statusSelect,
        item.status
    );

    if (item.rating === null) {
        ratingInput.value = "";
    } else {
        ratingInput.value = item.rating;
    }

    formTitle.textContent = "Редактировать элемент";
    saveButton.textContent = "Сохранить изменения";

    addForm.style.display = "flex";
}

// collection
async function refreshCollection() {
    await loadItems();
    await loadStats();
}

function createCard(item) {
    const card = document.createElement("article");
    card.classList.add("card");
    card.dataset.itemId = item.id;

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
    favoriteButton.type = "button";
    favoriteButton.classList.add("favorite-button");

    const favoriteIcon = document.createElement("img");
    favoriteIcon.classList.add("favorite-icon");
    favoriteIcon.alt = "";

    favoriteButton.appendChild(favoriteIcon);

    updateFavoriteButton(favoriteButton, favoriteIcon, Boolean(item.favorite));

    favoriteButton.addEventListener(
        "click",
        async function(event) {
            event.stopPropagation();

            const newFavorite = !Boolean(item.favorite);

            favoriteButton.disabled = true;

            try {
                const response = await fetch(
                    API_BASE_URL + "/items/" + item.id + "/favorite",
                    {
                        method: "PATCH",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({favorite: newFavorite})
                    }
                );

                if (!response.ok) {
                    alert("Не удалось изменить избранное");
                    return;
                }

                const updatedItem = await response.json();

                item.favorite = updatedItem.favorite;

                updateFavoriteButton(favoriteButton, favoriteIcon, Boolean(item.favorite));

                await loadStats();

                if (currentPage === "favorites") {
                    await loadItems(false);
                }

            } catch(error) {
                console.error(error);
                alert("Не удалось связаться с сервером");
            } finally {
                favoriteButton.disabled = false;
            }
        }
    );

    const moreButton = document.createElement("button");
    moreButton.classList.add("more-button");
    moreButton.textContent = "⋮";
    moreButton.type = "button";
    moreButton.setAttribute("aria-label", "Действия");

    const cardMenuWrapper = document.createElement("div");
    cardMenuWrapper.classList.add("card-menu-wrapper");

    const cardMenu = document.createElement("div");
    cardMenu.classList.add("card-menu");

    const menuEditButton = document.createElement("button");
    menuEditButton.type = "button";
    menuEditButton.classList.add("card-menu-item");
    menuEditButton.textContent = "Редактировать";

    const menuDeleteButton = document.createElement("button");
    menuDeleteButton.type = "button";
    menuDeleteButton.classList.add("card-menu-item", "delete");
    menuDeleteButton.textContent = "Удалить";

    cardMenu.appendChild(menuEditButton);
    cardMenu.appendChild(menuDeleteButton);
    cardMenuWrapper.appendChild(moreButton);
    cardMenuWrapper.appendChild(cardMenu);

    moreButton.addEventListener(
        "click",
        function(event) {
            event.stopPropagation();
            const shouldOpen = !cardMenu.classList.contains("open");
            closeAllCardMenus(cardMenu);
            cardMenu.classList.toggle("open", shouldOpen);
        }
    );

    menuEditButton.addEventListener(
        "click",
        function(event) {
            event.stopPropagation();
            cardMenu.classList.remove("open");
            openEditForm(item);
        }
    );

    menuDeleteButton.addEventListener(
        "click",
        function(event) {
            event.stopPropagation();
            cardMenu.classList.remove("open");
            openDeleteConfirm(item);
        }
    );

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

    topActions.appendChild(favoriteButton);
    topActions.appendChild(cardMenuWrapper);

    cardHeader.appendChild(title);
    cardHeader.appendChild(topActions);

    rating.appendChild(ratingLabel);
    rating.appendChild(ratingValue);

    cardInfo.appendChild(cardHeader);
    cardInfo.appendChild(typeBadge);
    cardInfo.appendChild(statusBadge);
    cardInfo.appendChild(rating);

    card.appendChild(cover);
    card.appendChild(cardInfo);

    cardsContainer.appendChild(card);
}

function showCardsMessage(text) {
    cardsContainer.innerHTML = "";

    const message = document.createElement("div");

    message.classList.add("cards-message");
    message.textContent = text;

    cardsContainer.appendChild(message);
}

async function loadItems(
    showLoading = true
) {
    if (showLoading){
        showCardsMessage("Загрузка...");
    }

    const params = new URLSearchParams();
    const search = searchInput.value.trim();

    if (currentPage === "favorites") {
        params.append("favorite", "true");
    }

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

    let url = API_BASE_URL + "/items";
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

        collectionCount.textContent = items.length;

        if (items.length === 0) {
            if (currentPage === "favorites") {
                showCardsMessage("В избранном ничего нет");
            } else {
                showCardsMessage("Ничего не найдено");
            }
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

// stats
function updateStats(items) {
    const total = items.length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const weeklyItems = items.filter(
        function(item) {
            if (!item.created_at) {
                return false;
            }

            const createdAt = new Date(item.created_at.replace(" ", "T") + "Z");
            const createdAtMs = createdAt.getTime();
            return(!Number.isNaN(createdAtMs) && createdAtMs >= sevenDaysAgo);

        }
    );

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

    const favoriteItems = items.filter(
        function(item) {
            return Boolean(item.favorite);
        }
    );

    totalCount.textContent = total;
    weeklyCount.textContent = "+" + weeklyItems.length + " за неделю";

    completedCount.textContent = completedItems.length;
    progressCount.textContent = progressItems.length;
    plannedCount.textContent = plannedItems.length;
    favoriteCount.textContent = favoriteItems.length;

    if (total === 0) {
        completedPercent.textContent = "0% коллекции";
        progressPercent.textContent = "0% коллекции";
        plannedPercent.textContent = "0% коллекции";
        favoritePercent.textContent = "0% коллекции";

        return;
    }

    const completedPercentage = Math.round(completedItems.length / total * 100);
    const progressPercentage = Math.round(progressItems.length / total * 100);
    const plannedPercentage = Math.round(plannedItems.length / total * 100);
    const favoritePercentage = Math.round(favoriteItems.length / total * 100);

    completedPercent.textContent = completedPercentage + "% коллекции";
    progressPercent.textContent = progressPercentage + "% коллекции";
    plannedPercent.textContent = plannedPercentage + "% коллекции";
    favoritePercent.textContent = favoritePercentage + "% коллекции";
}

async function loadStats() {
    try {
        const response = await fetch(API_BASE_URL + "/items");

        if (!response.ok) {
            throw new Error("HTTP ошибка: " + response.status);
        }

        const items = await response.json();

        updateStats(items);

    } catch(error) {
        console.error("Ошибка загрузки статистики:", error);
    } 
}

// random pick
function closeRandomResult() {
    randomResult.style.display = "none";
}

async function loadRandomItem() {
    if (randomLoading) {
        return;
    }

    randomLoading = true;

    const popoverIsOpen = randomResult.style.display === "block";

    randomButton.disabled = true;
    randomAgainButton.disabled = true;

    if (popoverIsOpen) {
        randomAgainButton.textContent = "Выбираю...";
    } else {
        randomButton.textContent = "Выбираю...";
    }

    const params = new URLSearchParams();

    if (randomType.value !== "all") {
        params.append("type", randomType.value);
    }

    if (randomStatus.value !== "all") {
        params.append("status", randomStatus.value);
    }

    let url = RANDOM_SERVICE_URL + "/random";

    const queryString = params.toString();

    if (queryString !== "") {
        url += "?" + queryString;
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            alert("Ничего подходящего не найдено");
            return;
        }

        const item = await response.json();

        currentRandomItem = item;
        randomCover.textContent = item.title;
        randomTitle.textContent = item.title;
        randomTypeBadge.textContent = getTypeName(item.type);
        randomTypeBadge.className = "type-badge " + item.type;
        randomStatusBadge.textContent = getStatusName(item.status);
        randomStatusBadge.className = "status-badge " + item.status;

        if (item.rating === null) {
            randomRating.textContent = "-/10";
        } else {
            randomRating.textContent = "★ " + item.rating + " /10";
        }

        randomResult.style.display = "block";
    } catch(error) {
        console.error("Ошибка случайного выбора:", error);
        alert("Не удалось связаться с сервисом");
    } finally {
        randomLoading = false;

        randomButton.disabled = false;
        randomAgainButton.disabled = false;

        randomButton.textContent = "Что выбрать сегодня?";
        randomAgainButton.textContent = "Еще вариант";
    }
}

// =====
// events
// =====

// navigation
navItems.forEach(
    function(navItem) {
        navItem.addEventListener(
            "click",
            function() {
                const page = navItem.dataset.page;

                if (page !== "collection" && page !== "favorites") {
                    return;
                }
                openPage(page);
            }
        );
    }
);

//filters
filterType.addEventListener(
    "change",
    function() {
        loadItems();
    }
);

filterStatus.addEventListener(
    "change",
    function() {
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

//form
addButton.addEventListener(
    "click", 
    function() {
        closeRandomResult();
        openAddForm();
    }
);

cancelButton.addEventListener(
    "click",
    closeForm
)

saveButton.addEventListener(
    'click',
    async function() {
        const title = titleInput.value.trim();
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

        let url = API_BASE_URL + "/items";
        let method = "POST"

        if (editingItemId !== null) {
            url = API_BASE_URL + "/items/" + editingItemId;
            method = "PUT"
        }

        try {
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

            resetForm();
            closeForm();

            saveButton.textContent = "Сохранить";

            await refreshCollection();

        }catch(error) {
            console.error(error);
            alert("Не удалось связаться с сервером");
        }
    } 
);

// delete confirmation
cancelDeleteButton.addEventListener(
    "click",
    closeDeleteConfirm
);

confirmDeleteButton.addEventListener(
    "click",
    async function() {
        if (pendingDeleteItem === null) {
            return;
        }

        const itemId = pendingDeleteItem.id;
        confirmDeleteButton.disabled = true;

        try {
            const response = await fetch(
                API_BASE_URL + "/items/" + itemId,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                alert("Не удалось удалить элемент");
                return;
            }

            closeDeleteConfirm();
            await refreshCollection();
        } catch(error) {
            console.error(error);
            alert("Не удалось связаться с сервером");
        } finally {
            confirmDeleteButton.disabled = false;
        }
    }
);

deleteConfirmModal.addEventListener(
    "click",
    function(event) {
        if (event.target === deleteConfirmModal) {
            closeDeleteConfirm();
        }
    }
);

// random
randomButton.addEventListener(
    "click",
    function() {
        closeForm();
        loadRandomItem();
    }
);

randomAgainButton.addEventListener(
    "click",
    loadRandomItem
);

randomOpenButton.addEventListener(
    "click",
    async function() {
        if (currentRandomItem == null) {
            return;
        }

        let selectedCard = cardsContainer.querySelector('[data-item-id="' + currentRandomItem.id + '"]');

        if (selectedCard === null) {
            searchInput.value = "";
            setSelectValue(
                filterType,
                "all"
            );
            setSelectValue(
                filterStatus,
                "all"
            );
            setSelectValue(
                sortSelect,
                "default"
            );

            await loadItems(false);

            selectedCard = cardsContainer.querySelector('[data-item-id="' + currentRandomItem.id + '"]');
        }

        closeRandomResult();

        if (selectedCard !== null) {
            selectedCard.classList.add("card-highlight");

            selectedCard.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

            setTimeout(
                function() {
                    selectedCard.classList.remove("card-highlight");
                },
                1600
            );          
        }
    }
);

// global
document.addEventListener(
    "click",
    function(event) {
        const clickedInsideForm = addForm.contains(event.target);
        const clickedAddButton = addButton.contains(event.target);

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
            closeRandomResult();
            closeAllCustomSelects();
            closeDeleteConfirm();
            closeAllCardMenus();
        }
    }
);

document.addEventListener(
    "pointerdown",
    function(event) {
        const clickedInsideRandom = randomMenu.contains(event.target);

        if (!clickedInsideRandom) {
            closeRandomResult();
        }
    }
);

document.addEventListener(
    "pointerdown",
    function(event) {
        let clickedInsideCustomSelect = false;

        customSelectRegistry.forEach(
            function(component) {
                if (component.wrapper.contains(event.target)) {
                    clickedInsideCustomSelect = true;
                }
            }
        );
        if (!clickedInsideCustomSelect) {
            closeAllCustomSelects();
        }
    }
);

document.addEventListener(
    "click",
    function(event) {
        if (!event.target.closest(".card-menu-wrapper")) {
            closeAllCardMenus();
        }
    }
);

// init
document.querySelectorAll("select[data-custom-select]").forEach(
    function(select) {
        initCustomSelect(select);
    }
);

openPage("collection");
loadStats();