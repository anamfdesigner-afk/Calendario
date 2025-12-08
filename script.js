document.getElementById("loadData").addEventListener("click", () => {
    fetch("https://api.sheety.co/76a6d2f0ca2083ffa98601cdbdc2e82c/calendarioTeste/sheet1", {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("output").textContent = JSON.stringify(data.sheet1, null, 2);
    })
    .catch(err => {
        document.getElementById("output").textContent = "Erro: " + err;
    });
});
