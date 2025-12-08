// URL do Sheety (GET e POST usam a mesma URL)
const sheetyUrl = 'https://api.sheety.co/76a6d2f0ca2083ffa98601cdbdc2e82c/calendarioTeste/sheet1';

const slotsInfo = [
    { time: "08:00-08:45", max: 3 },
    { time: "08:45-09:30", max: 2 },
    { time: "09:30-10:15", max: 3 },
    { time: "10:15-11:00", max: 2 }
];

let selectedDate = null;
let selectedSlot = null;
let reservations = []; // dados da Sheet
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// --- Funções ---
function loadReservations() {
    return fetch(sheetyUrl)
        .then(res => res.json())
        .then(json => {
            reservations = json.sheet1; // nome da aba no Sheety
        });
}

function renderCalendar() {
    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    document.getElementById("monthYear").textContent = new Date(currentYear, currentMonth).toLocaleString('pt-PT', { month: 'long', year: 'numeric' });

    // dias vazios no início
    for (let i = 0; i < firstDay; i++) calendar.appendChild(document.createElement("div"));

    // dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = d;
        dayDiv.className = "day";

        const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const todayStr = new Date().toISOString().split("T")[0];
        if (dateStr < todayStr) dayDiv.classList.add("disabled");

        dayDiv.addEventListener("click", () => {
            if (dayDiv.classList.contains("disabled")) return;
            selectedDate = dateStr;
            selectedSlot = null;
            renderSlots();
        });

        calendar.appendChild(dayDiv);
    }
}

function renderSlots() {
    const container = document.getElementById("slotsContainer");
    container.innerHTML = "";
    if (!selectedDate) return;

    slotsInfo.forEach(slot => {
        const count = reservations.filter(r => r.Data === selectedDate && r.Hora === slot.time).length;
        const slotDiv = document.createElement("div");
        slotDiv.textContent = `${slot.time} (${count}/${slot.max})`;
        slotDiv.className = "slot";
        if (count >= slot.max) slotDiv.classList.add("full");

        slotDiv.addEventListener("click", () => {
            if (slotDiv.classList.contains("full")) return;
            selectedSlot = slot.time;
            document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
            slotDiv.classList.add("selected");
            document.getElementById("confirmBtn").disabled = false;
        });

        container.appendChild(slotDiv);
    });
}

// --- Confirmação ---
document.getElementById("confirmBtn").addEventListener("click", () => {
    if (!selectedDate || !selectedSlot) return;

    fetch(sheetyUrl, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ sheet1: { Data: selectedDate, Hora: selectedSlot }})
    })
    .then(res => res.json())
    .then(() => {
        document.getElementById("message").textContent = "Obrigado, a tua reserva foi efetuada!";
        loadReservations().then(renderSlots);
        document.getElementById("confirmBtn").disabled = true;
        selectedSlot = null;
    })
    .catch(err => alert("Erro ao confirmar: " + err));
});

// --- Navegação de meses ---
document.getElementById("prevMonth").addEventListener("click", () => { 
    currentMonth--; 
    if(currentMonth<0){currentMonth=11; currentYear--;} 
    renderCalendar(); 
});

document.getElementById("nextMonth").addEventListener("click", () => { 
    currentMonth++; 
    if(currentMonth>11){currentMonth=0; currentYear++;} 
    renderCalendar(); 
});

// --- Inicialização ---
loadReservations().then(renderCalendar);
