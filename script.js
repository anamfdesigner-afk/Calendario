document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "https://api.sheety.co/76a6d2f0ca2083ffa98601cdbdc2e82c/calendarioTeste/sheet1";

    // Slots fixos todos os dias
    const SLOTS = [
        { hora: "08:00-08:45", vagas: 3 },
        { hora: "08:45-09:30", vagas: 2 },
        { hora: "09:30-10:15", vagas: 3 },
        { hora: "10:15-11:00", vagas: 2 }
    ];

    let currentDate = new Date();
    let selectedDate = null;
    let selectedSlot = null;
    let reservas = []; // dados vindos do Sheety

    const calendarEl = document.getElementById("calendar");
    const slotContainer = document.getElementById("slotContainer");
    const confirmBtn = document.getElementById("confirmBtn");

    confirmBtn.disabled = true;

    // --------------------------
    // 1) BUSCAR RESERVAS EXISTENTES DO SHEETY
    // --------------------------
    function carregarReservas() {
        return fetch(API_URL)
            .then(r => r.json())
            .then(data => {
                reservas = data.sheet1;
                renderCalendar();
            });
    }

    // --------------------------
    // 2) RENDER CALENDÁRIO
    // --------------------------
    function renderCalendar() {
        calendarEl.innerHTML = "";

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const title = document.createElement("h2");
        title.textContent = `${currentDate.toLocaleString("pt-PT", { month: "long" })} ${year}`;
        calendarEl.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "calendar-grid";

        // espaços antes do dia 1
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.className = "empty";
            grid.appendChild(empty);
        }

        // dias do mês
        for (let day = 1; day <= lastDate; day++) {
            const btn = document.createElement("button");
            btn.textContent = day;

            btn.addEventListener("click", () => {
                selectedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                renderSlots();
            });

            grid.appendChild(btn);
        }

        calendarEl.appendChild(grid);
    }

    // --------------------------
    // 3) RENDER SLOTS POR DIA
    // --------------------------
    function renderSlots() {
        slotContainer.innerHTML = "";

        if (!selectedDate) return;

        slotContainer.innerHTML = `<h3>Horários para ${selectedDate}</h3>`;

        SLOTS.forEach(slot => {
            const reservasSlot = reservas.filter(r => r.Data === selectedDate && r.Hora === slot.hora).length;
            const vagasRestantes = slot.vagas - reservasSlot;

            const btn = document.createElement("button");
            btn.textContent = `${slot.hora} (${vagasRestantes} vagas)`;

            if (vagasRestantes <= 0) {
                btn.disabled = true;
                btn.classList.add("disabled");
            }

            btn.addEventListener("click", () => {
                selectedSlot = slot.hora;
                confirmBtn.disabled = false;
            });

            slotContainer.appendChild(btn);
        });
    }

    // --------------------------
    // 4) ENVIAR RESERVA PARA O SHEETY (POST)
    // --------------------------
    confirmBtn.addEventListener("click", () => {
        if (!selectedDate || !selectedSlot) return;

        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sheet1: {
                    Data: selectedDate,
                    Hora: selectedSlot
                }
            })
        })
            .then(r => r.json())
            .then(() => {
                alert("Obrigada! A tua reserva foi registada.");
                confirmBtn.disabled = true;

                // recarregar dados para atualizar vagas
                carregarReservas();
            });
    });

    // --------------------------
    // 5) BOTÕES DE NAVEGAÇÃO ENTRE MESES
    // --------------------------
    document.getElementById("prevMonth").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Carrega tudo
    carregarReservas();
});

