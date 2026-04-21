// Módulo de Medallas - Funcionalidad completa

// Crear nueva medalla
function createNewMedal() {
    const name = document.getElementById("medalName").value.trim();
    const icon = document.getElementById("medalIcon").value.trim();
    const description = document.getElementById("medalDescription").value.trim();
    
    if (!name || !icon || !description) {
        alert("Por favor completa todos los campos");
        return;
    }
    
    const newMedal = {
        id: window.nextMedalId || 9,
        name: name,
        icon: icon,
        description: description
    };
    
    if (!window.availableMedals) window.availableMedals = [];
    window.availableMedals.push(newMedal);
    
    // Actualizar el ID para la próxima medalla
    window.nextMedalId = (window.nextMedalId || 9) + 1;
    
    saveToLocalStorage();
    
    // Cerrar modal y limpiar formulario
    const modal = bootstrap.Modal.getInstance(document.getElementById("createMedalModal"));
    modal.hide();
    document.getElementById("createMedalForm").reset();
    
    // Actualizar la sección de medallas
    populateMedalsSection();
    
    showSuccessAnimation(`¡Medalla "${name}" creada exitosamente!`);
}

// Poblar sección de medallas (versión corregida)
function populateMedalsSection() {
    // Poblar selector de héroes
    const heroSelect = document.getElementById("medalHeroSelect");
    if (!heroSelect) {
        console.error("No se encontró el selector de héroes");
        return;
    }
    
    heroSelect.innerHTML = "<option value=\"\">Selecciona un héroe...</option>";
    
    if (window.heroes) {
        window.heroes.forEach(hero => {
            const option = document.createElement("option");
            option.value = hero.id;
            option.textContent = `${hero.heroName} (${hero.realName})`;
            heroSelect.appendChild(option);
        });
    }
    
    // Poblar selección de medallas
    const medalSelection = document.getElementById("medalSelection");
    if (!medalSelection) {
        console.error("No se encontró el contenedor de selección de medallas");
        return;
    }
    
    medalSelection.innerHTML = "";
    
    if (window.availableMedals) {
        window.availableMedals.forEach(medal => {
            const medalCard = document.createElement("div");
            medalCard.className = "col-md-6 col-sm-4 mb-2";
            medalCard.innerHTML = `
                <div class="card text-center p-2 medal-option" data-medal-id="${medal.id}" style="cursor: pointer; border: 2px solid transparent;">
                    <div style="font-size: 2rem;">${medal.icon}</div>
                    <small>${medal.name}</small>
                </div>
            `;
            
            const medalOption = medalCard.querySelector(".medal-option");
            if (medalOption) {
                medalOption.onclick = function() {
                    document.querySelectorAll(".medal-option").forEach(el => {
                        el.style.borderColor = "transparent";
                    });
                    this.style.borderColor = "#FFD700";
                };
            }
            
            medalSelection.appendChild(medalCard);
        });
    }
    
    // Poblar historial de medallas entregadas
    populateMedalsHistory();
}

// Entregar medalla (versión corregida)
function awardMedal() {
    const heroId = parseInt(document.getElementById("medalHeroSelect").value);
    const selectedMedalEl = document.querySelector(".medal-option[style*=\"border-color: rgb(255, 215, 0)\"]");
    
    if (!heroId) {
        alert("Por favor selecciona un héroe");
        return;
    }
    
    if (!selectedMedalEl) {
        alert("Por favor selecciona una medalla");
        return;
    }
    
    const medalId = parseInt(selectedMedalEl.dataset.medalId);
    const medal = window.availableMedals.find(m => m.id === medalId);
    const hero = window.heroes.find(h => h.id === heroId);
    
    if (!medal || !hero) return;
    
    // Agregar medalla al héroe
    if (!hero.medals) hero.medals = [];
    
    // Verificar si ya tiene esta medalla
    const hasMedal = hero.medals.some(m => m.id === medalId);
    if (hasMedal) {
        alert("Este héroe ya tiene esta medalla");
        return;
    }
    
    hero.medals.push({
        ...medal,
        date: new Date()
    });
    
    saveToLocalStorage();
    populateMedalsSection();
    
    // Actualizar vista del estudiante si es el héroe actual
    if (window.currentUser && window.currentUser.id === heroId) {
        updateStudentView();
    }
    
    showSuccessAnimation(`¡${medal.name} entregada a ${hero.heroName}!`);
    
    // Limpiar selección
    document.getElementById("medalHeroSelect").value = "";
    document.querySelectorAll(".medal-option").forEach(el => {
        el.style.borderColor = "transparent";
    });
}

// Quitar medalla
function removeMedal(heroId, medalIndex) {
    if (!confirm("¿Estás seguro de que quieres quitar esta medalla?")) return;
    
    const hero = window.heroes.find(h => h.id === heroId);
    if (!hero || !hero.medals) return;
    
    hero.medals.splice(medalIndex, 1);
    
    saveToLocalStorage();
    populateMedalsSection();
    
    // Actualizar vista del estudiante si es el héroe actual
    if (window.currentUser && window.currentUser.id === heroId) {
        updateStudentView();
    }
    
    showSuccessAnimation("Medalla quitada exitosamente");
}

// Poblar historial de medallas
function populateMedalsHistory() {
    const container = document.getElementById("medalsHistory");
    if (!container) return;
    
    container.innerHTML = "";
    
    let allMedals = [];
    
    if (window.heroes) {
        window.heroes.forEach(hero => {
            if (hero.medals) {
                hero.medals.forEach((medal, index) => {
                    allMedals.push({
                        hero: hero,
                        medal: medal,
                        medalIndex: index
                    });
                });
            }
        });
    }
    
    // Ordenar por fecha (más reciente primero)
    allMedals.sort((a, b) => new Date(b.medal.date) - new Date(a.medal.date));
    
    if (allMedals.length === 0) {
        container.innerHTML = "<p class=\"text-muted\">Aún no se han entregado medallas</p>";
        return;
    }
    
    allMedals.forEach(item => {
        const medalCard = document.createElement("div");
        medalCard.className = "card mb-2";
        medalCard.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex align-items-center">
                    <div style="font-size: 1.5rem; margin-right: 10px;">${item.medal.icon}</div>
                    <div class="flex-grow-1">
                        <strong>${item.medal.name}</strong>
                        <div class="text-muted small">${item.hero.heroName} - ${new Date(item.medal.date).toLocaleDateString()}</div>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="removeMedal(${item.hero.id}, ${item.medalIndex})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(medalCard);
    });
}

// Guardar datos de medallas
function saveToLocalStorage() {
    if (typeof window.availableMedals !== "undefined" && typeof window.heroes !== "undefined") {
        const dataToSave = JSON.stringify({
            heroes: window.heroes || [],
            pointsHistory: window.pointsHistory || [],
            availableAvatars: window.availableAvatars || [],
            availableEmojis: window.availableEmojis || [],
            availableMedals: window.availableMedals || []
        });

        // Usar safeStorage si está disponible (definido en superheroes.js)
        if (window.safeStorage) {
            window.safeStorage.setItem("superheroes_data", dataToSave);
        } else {
            try {
                localStorage.setItem("superheroes_data", dataToSave);
            } catch (e) {
                console.warn("Storage no disponible en medals.js");
            }
        }
    }
}

