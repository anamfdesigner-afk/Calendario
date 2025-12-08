document.getElementById("loadData").addEventListener("click", () => {
    fetch("https://script.google.com/macros/s/AKfycbzKM9eB4Zo4GQ5nICmE_SS1TZcx7FcE184MIk9b489SgpGigKLNGokVyJPho8JT9-qR/exec", {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("output").textContent = JSON.stringify(data, null, 2);
    })
    .catch(err => {
        document.getElementById("output").textContent = "Erro: " + err;
    });
});
