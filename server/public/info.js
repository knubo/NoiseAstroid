
let players = {};

function renderScores() {
    const playerListElement = document.getElementById('player_list');
    if(!playerListElement) {
        return;
    }
    playerListElement.innerHTML = ''; // Clear existing list items

    console.log(players);

    for (const id in players) {
        if (players.hasOwnProperty(id)) {
            const [nick, score] = players[id];
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>${nick}:</span> ${score}`;
            playerListElement.appendChild(listItem);
        }
    }
}

window.clearScore = function clearScore(id) {
    delete players.id;
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