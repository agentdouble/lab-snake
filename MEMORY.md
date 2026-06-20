# MEMORY.md

- Le projet est un Snake web statique sans dependance runtime. L'entree est `index.html`, le code applicatif est dans `src/`, et `npm start` lance `python3 -m http.server 4173`.
- La logique de jeu testable vit dans `src/engine.js`; le rendu canvas, les entrees clavier/tactile, le stockage local et le bootstrap sont separes dans `renderer.js`, `input.js`, `storage.js` et `main.js`.
- Les reglages de jeu disponibles dans l'UI sont centralises dans `src/settings.js`; le moteur accepte un multiplicateur de vitesse optionnel et le renderer applique les themes de plateau via ce module.
- Les tests utilisent le runner Node integre via `npm test`, avec les scenarios de base dans `tests/engine.test.js`.
- Le depot GitHub cible est `https://github.com/agentdouble/lab-snake`; la branche de publication est `main`.
- La pause Snake est modelee dans `src/engine.js` avec `pauseGame`/`resumeGame`; le bouton UI `pause-button` bascule entre Pause et Reprendre sans reinitialiser l'etat de jeu.
- Le menu `Reglages` expose les vitesses `Lente`, `Normale`, `Rapide` et `Expert`; ce choix est sauvegarde par `storage.js` et applique au delai moteur via le multiplicateur de `settings.js`.
- Les types de map Snake sont definis dans `src/maps.js`; le choix de map est un champ de `src/settings.js`, persiste dans `snake.settings`, et une nouvelle partie applique la map selectionnee.
- Le choix de couleur du serpent est centralise dans `src/snake-colors.js` et stocke dans `settings.snakeColor`; `settings.keepSnakeColorOnRestart` rend explicite si `Rejouer` garde la couleur ou revient au vert par defaut.
