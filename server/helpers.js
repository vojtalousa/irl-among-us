export const randSelection = (arr, num) => {
    const others = [...arr];
    const chosen = [];
    for (let i = 0; i < num; i++) {
        const index = Math.floor(Math.random() * others.length);
        const impostor = others.splice(index, 1)[0];
        if (!impostor) break;
        chosen.push(impostor);
    }
    return { chosen, others };
}

export const logHistory = []
export const log = (...messages) => {
    const message = messages.join(' ');
    const date = new Date();
    const hours = `${date.getHours()}`.padStart(2, '0')
    const minutes = `${date.getMinutes()}`.padStart(2, '0')
    const seconds = `${date.getSeconds()}`.padStart(2, '0')
    const logEntry = `[${hours}:${minutes}:${seconds}] ${message}`;
    logHistory.push(logEntry);
    if (logHistory.length > 100) logHistory.shift();
    console.log(logEntry);
}