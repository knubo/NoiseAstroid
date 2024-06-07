
let players = {};

function renderScores() {
    const playerListElement = document.getElementById('player_list');
    if(!playerListElement) {
        return;
    }
    playerListElement.innerHTML = ''; // Clear existing list items

    for (const id in players) {
        if (players.hasOwnProperty(id)) {
            const [nick, score] = players[id];
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>${nick}:</span> ${score}`;
            playerListElement.appendChild(listItem);
        }
    }
}

window.getPlayerShortNick = function getPlayerShortNick(id) {
    let nickAndScore = players[id];

    if(!nickAndScore || !nickAndScore[0]) {
        return "Unknown";
    }
    let nick = nickAndScore[0];
    return nick;
}

window.clearScore = function clearScore(id) {
    delete players[id];
}

window.updatePowerups = function updatePowerups(obj) {
    const powerupsElement = document.getElementById('powerups');
    powerupsElement.innerHTML = '';

    for (const id in obj) {
        if (obj.hasOwnProperty(id)) {
            const value = obj[id];
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>${id}:</span> ${value}`;
            powerupsElement.appendChild(listItem);
        }
    }
}

window.updateEnergy = function updateEnergy(value) {
    document.getElementById('energyValue').innerHTML = value;
}

window.updatePlayerScore = function updatePlayerScore(id, nick, score) {

    if(nick) {
        players[id] = [nick, score];
    }
    else {
        if(!players[id]) {
            players[id] = ["Unknown", score];
        } else {
            players[id][1] = score;
        }
    }
    

    renderScores();
}
