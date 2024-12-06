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