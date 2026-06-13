# MEMORY.md

- Le projet est un Snake web statique sans dependance runtime. L'entree est `index.html`, le code applicatif est dans `src/`, et `npm start` lance `python3 -m http.server 4173`.
- La logique de jeu testable vit dans `src/engine.js`; le rendu canvas, les entrees clavier/tactile, le stockage local et le bootstrap sont separes dans `renderer.js`, `input.js`, `storage.js` et `main.js`.
- Les tests utilisent le runner Node integre via `npm test`, avec les scenarios de base dans `tests/engine.test.js`.
- Le depot GitHub cible est `https://github.com/agentdouble/lab-snake`; la branche de publication est `main`.
- Les profils de vitesse du serpent sont definis dans `src/constants.js`, appliques par `getTickDelay(score, speedKey)` dans `src/engine.js`, et conserves par `resetGame` entre deux parties.
