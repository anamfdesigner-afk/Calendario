// ----------------------
// CONFIGURAÇÃO
// ----------------------
const SHEETY_URL = "https://api.sheety.co/76a6d2f0ca2083ffa98601cdbdc2e82c/calendarioTeste/sheet1";

// HORÁRIOS E VAGAS (ajusta se precisares)
const horarios = [
  { hora: "08:00 - 08:45", vagas: 3 },
  { hora: "08:45 - 09:30", vagas: 2 },
  { hora: "09:30 - 10:15", vagas: 3 },
  { hora: "10:15 - 11:00", vagas: 2 }
];

let reservas = [];        // reservas carregadas do Sheety
let selectedDate = null;  // string "DD/M/MYYYY"
let selectedSlot = null;  // string com hora
let reservaFeita = false; // bloqueio depois de confirmar

// ----------------------
// FUNÇÃO: carregar reservas existentes do SHEETY
// ----------------------
async function loadReservas() {
  try {
    const res = await fetch(SHEETY_URL);
    const data = await res.json();
    reservas = data.sheet1 || [];
  } catch (err) {
    console.error("Erro ao carregar reservas:", err);
    reservas = [];
  }
}

// ----------------------
// CALENDÁRIO
// ----------------------
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const today = new Date();

function renderCalendar() {
  calendar.innerHTML = "";

  const firstOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayIndex = firstOfMonth.getDay(); // 0..6
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

  monthYear.innerText = firstOfMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

  // espaços vazios antes do 1º dia
  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    empty.style.visibility = "hidden";
    calendar.appendChild(empty);
  }

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrow = new Date(todayOnly);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const div = document.createElement("div");
    div.className = "day";
    div.innerText = day;

    // bloqueia hoje e dias passados (<= today)
    if (d <= todayOnly) {
      div.classList.add("disabled");
    }

    // click => seleccionar dia (se não estiver bloqueado e se não tivermos reservado já)
    div.addEventListener("click", () => {
      if (div.classList.contains("disabled") || reservaFeita) return;
      document.querySelectorAll(".day").forEach(x => x.classList.remove("selected"));
      div.classList.add("selected");
      selectedDate = `${day}/${currentMonth + 1}/${currentYear}`;
      renderSlots();
    });

    calendar.appendChild(div);
  }

  // seleccionar automaticamente AMANHÃ (se estiver no mesmo mês/ano mostrado)
  if (tomorrow.getMonth() === currentMonth && tomorrow.getFullYear() === currentYear) {
    const dayEls = Array.from(document.querySelectorAll(".day")).filter(el => !el.classList.contains("empty"));
    const tomEl = dayEls.find(el => Number(el.innerText) === tomorrow.getDate());
    if (tomEl && !reservaFeita) {
      tomEl.classList.add("selected");
      selectedDate = `${tomorrow.getDate()}/${tomorrow.getMonth() + 1}/${tomorrow.getFullYear()}`;
      renderSlots();
    }
  } else {
    // se amanhã não está neste mês, não seleccionar nada por defeito
    selectedDate = null;
    document.getElementById("slots").innerHTML = "";
    document.getElementById("confirm-container").style.display = "none";
  }
}

document.getElementById("prevMonth").onclick = () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
};

// ----------------------
// HORÁRIOS (slots)
// ----------------------
function renderSlots() {
  const slotsDiv = document.getElementById("slots");
  slotsDiv.innerHTML = "";

  if (!selectedDate) {
    document.getElementById("confirm-container").style.display = "none";
    return;
  }

  horarios.forEach(h => {
    // contar quantas reservas existem para a data+hora
    const usados = reservas.filter(r => r.data === selectedDate && r.hora === h.hora).length;
    const vagasRest = h.vagas - usados;
    const full = vagasRest <= 0;

    const slotEl = document.createElement("div");
    slotEl.className = "slot";
    if (full) slotEl.classList.add("full");

    slotEl.innerHTML = `<div class="hora">${h.hora}</div><div class="vagas">${vagasRest} available</div>`;

    if (!full && !reservaFeita) {
      slotEl.addEventListener("click", () => {
        // seleccionar slot
        document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
        slotEl.classList.add("selected");
        selectedSlot = h.hora;
        document.getElementById("confirm-container").style.display = "block";
      });
    }

    slotsDiv.appendChild(slotEl);
  });

  // se já tivermos reservado, bloqueia visualmente tudo
  if (reservaFeita) {
    document.getElementById("confirm-container").style.display = "none";
    document.querySelectorAll(".slot").forEach(s => {
      s.classList.add("full");
      s.style.pointerEvents = "none";
      s.style.opacity = "0.6";
    });
    document.getElementById("confirmBtn").disabled = true;
  }
}

// ----------------------
// CONFIRMAR RESERVA
// ----------------------
document.getElementById("confirmBtn").onclick = async () => {
  if (!selectedDate || !selectedSlot || reservaFeita) return;

  const payload = {
    sheet1: {
      data: selectedDate,
      hora: selectedSlot
    }
  };

  try {
    // enviar para Sheety
    const res = await fetch(SHEETY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Sheety POST falhou: ${res.status}`);

    // marcar localmente que o utilizador já reservou (bloqueio)
    reservaFeita = true;

    // actualizar reservas vindas do Sheety e slots
    await loadReservas();
    renderSlots();

    // mensagem ao utilizador
    const msg = `Thank you, your chosen date has been confirmed: ${selectedDate} — ${selectedSlot}`;
    document.getElementById("message").innerText = msg;
    document.getElementById("confirm-container").style.display = "none";
    document.getElementById("confirmBtn").disabled = true;
    document.getElementById("confirmBtn").style.opacity = "0.6";

  } catch (err) {
    console.error("Erro ao enviar reserva:", err);
    document.getElementById("message").innerText = "Erro ao confirmar. Tenta novamente.";
  }
};

// ----------------------
// INICIALIZAÇÃO
// ----------------------
(async function init() {
  await loadReservas();
  renderCalendar();
})();
