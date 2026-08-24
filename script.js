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

const filterType = document.getElementById("filterType");
const filterStatus = document.getElementById("filterStatus");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");

const randomType = document.getElementById("randomType");
const randomStatus = document.getElementById("randomStatus");

let editingItemId = null;

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
    const card = document.createElement("div");
    card.classList.add("card");

    const titleElement = document.createElement("h2");
    titleElement.textContent = item.title;
    
    const typeElement = document.createElement("p");
    typeElement.textContent = "Тип: " + getTypeName(item.type);

    const statusElement = document.createElement("p");
    statusElement.textContent = "Статус: " + getStatusName(item.status);

    const ratingElement = document.createElement("p");

    if (item.rating === null) {
        ratingElement.textContent = "Оценка: нет";
    } else {
        ratingElement.textContent = "Оценка: " + item.rating + "/10";
    }

    typeElement.classList.add("type");
    typeElement.classList.add(item.type);

    const deleteButton = document. createElement("button");
    deleteButton.textContent = "Удалить";

    const editButton = document.createElement("buttom");
    editButton.textContent = "Редактировать";

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

            saveButton.textContent = "Сохранить изменения";

            form.style.display = "block";
        }
    )

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
                card.remove();
            }
        }
    );

    card.appendChild(titleElement);
    card.appendChild(typeElement);
    card.appendChild(statusElement);
    card.appendChild(ratingElement);
    card.appendChild(deleteButton);
    card.appendChild(editButton);

    cardsContainer.appendChild(card);
}

async function loadItems() {
    cardsContainer.innerHTML = "";

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

    if (sortSelect.value !== "all") {
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

    const response = await fetch(url);
    const items = await response.json();

    items.forEach(
        function(item) {
            createCard(item);
        }
    )
}

loadItems();

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
            randomResult.textContent = "Ничегоподходящего не найдено";
            return
        }

        const item = await response.json();

        randomResult.textContent = "Сегодня: " + item.title + " - " + getTypeName(item.type);
    }
)

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
        loadItems();
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

        saveButton.textContent = "Сохранить";

        form.style.display = "block";
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
        }

        titleInput.value = "";
        typeSelect.value = "game";
        statusSelect.value = "planned";
        ratingInput.value = "";
        form.style.display = "none";

        editingItemId = null;
        saveButton.textContent = "Сохранить";

        await loadItems();
    }
);