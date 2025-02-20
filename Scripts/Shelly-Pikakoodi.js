﻿// Voit halutessasi tukea palvelun ylläpitoa täällä: https://www.buymeacoffee.com/spothintafi
// Tuetut Shelly laiteohjelmistoversiot: 1.0.3 - 1.0.8. Skriptin versio: 2023-11-08

// Asetukset
let Pikakoodi = 103;  // Hae sopiva pikakoodi: https://spot-hinta.fi/pikakoodit
let Releet = [0]; // Releen tai releiden numero. Arvoa ei tarvitse vaihtaa, jos Shelly on yksireleinen. Useampi rele määritellään pilkulla eroteltuna. Esim. [0,1,2]

// Alla olevaa koodia ei tarvitse muokata. Se suorittaa kyselyn rajapintaan ja ohjaa releiden toimintaa.
// Ohjaus tapahtuu tunnoin vaihduttua noin puolen minuutin aikana. Virheen tapahtuessa rele suljetaan, eli ohjaus sallitaan.
let cHour = -1; let Executed = false; let pAction = ""; let url = "https://api.spot-hinta.fi/QuickCode/" + Pikakoodi;
print("Pikakoodi: Skripti suoritetaan...");
Timer.set(30000, true, function () {
    let hour = new Date().getHours();
    if (cHour !== hour) { cHour = hour; Executed = false; print("Pikakoodi: Ensiohjaus tai tunti vaihtui. Suoritetaan ohjaus.") }
    if (cHour == hour && Executed == true) { print("Pikakoodi: Kuluva tunti on jo suoritettu onnistuneesti."); return; }
    Shelly.call("HTTP.GET", { url: url, timeout: 15, ssl_ca: "*" }, function (result, error_code) {
        if (error_code === 0 && result !== null) {
            if ((result.code === 400 || result.code === 200) && pAction === result.code) { print("Releiden tila pysyy samana kuin aiemmalla tunnilla."); Executed = true; return; }
            if (result.code === 400 || result.code === 200) {
                print("Pikakoodi: Onnistunut vastaus palvelimelta: " + result.body);
                for (let i = 0; i < Releet.length; i++) {
                    if (result.code === 400) { Shelly.call("Switch.Set", "{ id:" + Releet[i] + ", on:false}", null, null); pAction = result.code; print("Pikakoodi: Tunti on liian kallis. Rele " + Releet[i] + " avataan."); Executed = true; }
                    if (result.code === 200) { Shelly.call("Switch.Set", "{ id:" + Releet[i] + ", on:true}", null, null); pAction = result.code; print("Pikakoodi: Tunti on tarpeeksi halpa. Rele " + Releet[i] + " suljetaan."); Executed = true; }
                }
                return;
            }   
        }
        print("Pikakoodi: Virheellinen vastaus palvelimelta. Koodi: " + result.code + " - Vastaus: " + result.body);
        for (let i = 0; i < Releet.length; i++) {
            Shelly.call("Switch.Set", "{ id:" + Releet[i] + ", on:true}", null, null); print("Pikakoodi: Virhe ohjauksessa, rele " + Releet[i] + " suljetaan."); pAction = ""; Executed = false;
        }
    })
});