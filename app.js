document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("mount-container");

    // =========================
    // EXPANSION TAGS
    // =========================
    // Used to distinguish expansion filters from source filters

    const expansionTags = ["vanilla", "tbc", "wotlk", "cata", "mop", "wod", "legion", "bfa", "sl", "df", "tww", "mid"];

    // =========================
    // BUILD MOUNTS
    // =========================
    // Sort mounts alphabetically and build the HTML for each one

    mounts.sort((a, b) => a.name.localeCompare(b.name));

    mounts.forEach(mount => {
        const mountHTML = `
        <a href="${mount.url}" target="_blank"
           class="square ${mount.expansion} ${mount.source}"
           data-faction-tag="${mount.faction}"
           data-expansion="${mount.expansion}"
           data-source="${mount.source}"
           data-mount-id="${mount.id}"
           data-obtained="false">

            <img src="https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-${mount.display}.jpg"
                 alt="${mount.name}">

            <div class="additional-text">${mount.name}</div>

            ${mount.note ? `<div class="additional-text2">${mount.note}</div>` : ""}

            <div class="obtained-checkbox-container">
                <input type="checkbox" class="obtained-checkbox">
                <span class="obtained-text">Obtained</span>
            </div>
        </a>
        `;
        container.insertAdjacentHTML("beforeend", mountHTML);
    });

    // =========================
    // ELEMENTS (AFTER RENDER)
    // =========================

    const squares = document.querySelectorAll(".square");
    const filterCheckboxes = document.querySelectorAll(".filter");
    const searchBars = document.querySelectorAll(".search-bar");

    // =========================
    // LOCAL STORAGE (OBTAINED)
    // =========================

    function loadObtainedStatus() {
        squares.forEach(square => {
            const mountId = square.dataset.mountId;
            const obtained = localStorage.getItem(mountId) === "true";
            square.dataset.obtained = obtained;
            const checkbox = square.querySelector(".obtained-checkbox");
            if (checkbox) checkbox.checked = obtained;
            square.classList.toggle("obtained", obtained);
        });
    }

    function saveObtained(square, value) {
        const mountId = square.dataset.mountId;
        localStorage.setItem(mountId, value);
        square.dataset.obtained = value;
        square.classList.toggle("obtained", value);
    }

    // =========================
    // PROGRESS BAR
    // =========================

    function updateMountProgress() {
        const total = squares.length;
        const obtained = document.querySelectorAll('.square[data-obtained="true"]').length;
        const percent = total ? (obtained / total) * 100 : 0;
        document.getElementById("progress-bar").style.width = `${percent}%`;
        document.getElementById("progress-text").textContent =
            `${obtained} / ${total} Mounts Obtained`;
    }

    // =========================
    // FILTER BUTTON STYLES
    // =========================

    function updateFilterButtonStyles() {
        document.querySelectorAll(".filter-row-options label").forEach(label => {
            const cb = label.querySelector("input[type='checkbox']");
            if (cb.checked) {
                label.style.backgroundColor = "#0075FF";
                label.style.borderColor = "#0075FF";
            } else {
                label.style.backgroundColor = "#181818";
                label.style.borderColor = "#555";
            }
        });
    }

    // =========================
    // SINGLE SELECT ROWS
    // =========================

    const singleSelectRows = ["Faction", "Obtained"];

    function handleSingleSelectRow(clickedCb) {
        const row = clickedCb.closest(".filter-row-options");
        const allCbs = row.querySelectorAll("input[type='checkbox']");

        const checkedCount = Array.from(allCbs).filter(cb => cb.checked).length;
        if (!clickedCb.checked && checkedCount === 0) {
            clickedCb.checked = true;
            return;
        }

        allCbs.forEach(cb => {
            if (cb !== clickedCb) cb.checked = false;
        });

        filterSquares();
        updateFilterButtonStyles();
    }

    document.querySelectorAll(".filter-row").forEach(row => {
        const headerText = row.querySelector(".filter-row-header span:first-child")
            .textContent.replace("▶", "").trim();
        if (singleSelectRows.includes(headerText)) {
            row.querySelectorAll("input[type='checkbox']").forEach(cb => {
                cb.addEventListener("change", () => handleSingleSelectRow(cb));
            });
        }
    });

    // =========================
    // GET SELECTED FILTERS
    // =========================

    function getRowSelection(rowName) {
        const row = Array.from(document.querySelectorAll(".filter-row")).find(
            r => r.querySelector(".filter-row-header span:first-child")
                .textContent.replace("▶", "").trim() === rowName
        );
        const checked = row?.querySelector("input[type='checkbox']:checked");
        return checked ? checked.dataset.faction : null;
    }

    function getSelectedFaction() {
        return getRowSelection("Faction") ?? "both";
    }

    function getSelectedObtainedFilter() {
        return getRowSelection("Obtained") ?? "all";
    }

    // =========================
    // FILTERING
    // =========================

    function filterSquares() {
        const searchText = searchBars[0].value.toLowerCase().trim();
        const faction = getSelectedFaction();
        const obtainedFilter = getSelectedObtainedFilter();

        const activeExpansions = Array.from(filterCheckboxes)
            .filter(cb => cb.checked && cb.dataset.tag && expansionTags.includes(cb.dataset.tag))
            .map(cb => cb.dataset.tag);

        const activeSources = Array.from(filterCheckboxes)
            .filter(cb => cb.checked && cb.dataset.tag && !expansionTags.includes(cb.dataset.tag))
            .map(cb => cb.dataset.tag);

        squares.forEach(square => {
            const name = square.querySelector(".additional-text").textContent.toLowerCase();
            const alt = square.querySelector("img").alt.toLowerCase();

            const matchesSearch = name.includes(searchText) || alt.includes(searchText);

            const factionTag = square.dataset.factionTag;
            const isFactionMatch = faction === "both" ||
                factionTag === faction ||
                factionTag === "both";

            const obtained = square.dataset.obtained === "true";
            let isObtainedMatch = true;
            if (obtainedFilter === "owned") isObtainedMatch = obtained;
            if (obtainedFilter === "not owned") isObtainedMatch = !obtained;

            const isExpansionMatch = activeExpansions.length === 0
                ? false
                : activeExpansions.includes(square.dataset.expansion);

            const isSourceMatch = activeSources.length === 0
                ? false
                : activeSources.includes(square.dataset.source);

            const visible = matchesSearch && isFactionMatch && isObtainedMatch && isExpansionMatch && isSourceMatch;
            square.style.display = visible ? "block" : "none";
        });
    }

    // =========================
    // OBTAINED CHECKBOX EVENTS
    // =========================

    container.addEventListener("click", (e) => {
        const checkbox = e.target.closest(".obtained-checkbox");
        const text = e.target.closest(".obtained-text");

        if (text) {
            e.stopPropagation();
            const square = text.closest(".square");
            const cb = square.querySelector(".obtained-checkbox");
            cb.checked = !cb.checked;
            saveObtained(square, cb.checked);
            updateMountProgress();
            filterSquares();
            updateFilterButtonStyles();
        } else if (checkbox) {
            e.stopPropagation();
            const square = checkbox.closest(".square");
            saveObtained(square, checkbox.checked);
            updateMountProgress();
            filterSquares();
            updateFilterButtonStyles();
        }
    });

    // =========================
    // FILTER EVENTS
    // =========================

    searchBars.forEach(sb =>
        sb.addEventListener("input", filterSquares)
    );

    filterCheckboxes.forEach(cb =>
        cb.addEventListener("change", () => {
            const row = cb.closest(".filter-row");
            const headerText = row?.querySelector(".filter-row-header span:first-child")
                ?.textContent.replace("▶", "").trim();
            if (singleSelectRows.includes(headerText)) return;
            filterSquares();
            updateFilterButtonStyles();
        })
    );

    // =========================
    // DROPDOWN TOGGLE
    // =========================

    document.querySelectorAll(".filter-row-header").forEach(header => {
        header.addEventListener("click", () => {
            const options = header.nextElementSibling;
            const arrow = header.querySelector(".filter-arrow");
            options.classList.toggle("collapsed");
            arrow.classList.toggle("open");
        });
    });

    // =========================
    // INIT
    // =========================

    loadObtainedStatus();
    updateMountProgress();
    filterSquares();
    setTimeout(updateFilterButtonStyles, 0);
});