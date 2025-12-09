// ----------------------
// CONFIGURAÇÃO
// ----------------------
const SHEETY_URL = "https://api.sheety.co/76a6d2f0ca2083ffa98601cdbdc2e82c/calendarioTeste/sheet1";

// HORÁRIOS E VAGAS
const horarios = [
    { hora: "08:00 - 08:45", vagas: 3 },
    { hora: "08:45 - 09:30", vagas: 2 },
    { hora: "09:30 - 10:15", vagas: 3 },
    { hora: "10:15 - 11:00", vagas: 2 }
];

let selectedDate = null;
let selectedSlot = null;
let reservas = [];
let reservaFeita = false; // indica se a pessoa já confirmou

// ----------------------
// CARREGAR RESERVAS EXISTENTES
// ----------------------
async function loadReservas() {
    try {
        const res = await fetch(SHEETY_URL);
        const data = await res.json();
        reservas = data.sheet1 || [];
    } catch (e) {
        console.error("Erro ao carregar reservas:", e);
    }
}

// ----------------------
// CALENDÁRIO
// ----------------------
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderCalendar() {
    calendar.innerHTML = "";

    const date = new Date(currentYear, currentMonth, 1);
    const firstDayIndex = date.getDay();
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

    monthYear.innerText = date.toLocaleString("pt-PT", { month: "long", year: "numeric" });

    for (let i = 0; i < firstDayIndex; i++) {
        calendar.innerHTML += `<div></div>`;
    }

    for (let day = 1; day <= lastDay; day++) {
        const div = document.createElement("div");
        div.classList.add("day");
        div.innerText = day;

        div.addEventListener("click", () => {
            if (reservaFeita) return; // bloqueia seleção se já reservou
            document.querySelectorAll(".day").forEach(d => d.classList.remove("selected"));
            div.classList.add("selected");
            selectedDate = `${day}/${currentMonth + 1}/${currentYear}`;
            renderSlots();
        });

        calendar.appendChild(div);
    }
}

document.getElementById("prevMonth").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
};

// ----------------------
// HORÁRIOS
// ----------------------
function renderSlots() {
    const slotsDiv = document.getElementById("slots");
    slotsDiv.innerHTML = "";

    horarios.forEach(h => {
        const usados = reservas.filter(r => r.data === selectedDate && r.hora === h.hora).length;
        const full = usados >= h.vagas;

        const div = document.createElement("div");
        div.classList.add("slot");
        if (full) div.classList.add("full");

        div.innerText = `${h.hora} (${h.vagas - usados} vagas)`;

        // Apenas slots disponíveis e se ainda não reservou
        if (!full && !reservaFeita) {
            div.addEventListener("click", () => {
                document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
                div.classList.add("selected");
                selectedSlot = h.hora;
                document.getElementById("confirm-container").style.display = "block";
            });
        }

        slotsDiv.appendChild(div);
    });
}

// ----------------------
// CONFIRMAR
// ----------------------
document.getElementById("confirmBtn").onclick = async () => {
    if (!selectedDate || !selectedSlot || reservaFeita) return;

    const reserva = {
        data: selectedDate,
        hora: selectedSlot
    };

    await fetch(SHEETY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet1: reserva })
    });

    document.getElementById("message").innerText = "Obrigada! Reserva confirmada.";
    reservaFeita = true; // marca que a pessoa já reservou

    await loadReservas();
    renderSlots();

    // BLOQUEIA TODOS OS SLOTS E O BOTÃO DE CONFIRMAÇÃO
    document.querySelectorAll(".slot").forEach(slot => {
        slot.classList.add("full");
        slot.style.pointerEvents = "none";
        slot.style.opacity = "0.6";
    });

    document.getElementById("confirmBtn").disabled = true;
    document.getElementById("confirmBtn").style.opacity = "0.6";
};

// ----------------------
// INICIALIZAÇÃO
// ----------------------
loadReservas().then(renderCalendar);
