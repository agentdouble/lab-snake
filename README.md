# Snake

Petit Snake web, modulaire et sans dependance runtime.

## Commandes

```sh
npm test
npm start
```

`npm start` sert le dossier sur `http://localhost:4173`.

## Reglages

Le menu `Reglages` propose le mode `Standard` et le `Mode rapide`. En mode
standard, les vitesses `Lente`, `Normale`, `Rapide` et `Expert` restent
selectionnables avec les themes de plateau, la bascule de grille et la map des
nouvelles parties. Le mode rapide verrouille la vitesse effective sur `Rapide`
sans remplacer la vitesse manuelle sauvegardee. Ces choix sont sauvegardes
localement et s'appliquent a `Rejouer` comme aux prochaines parties. Le bouton
`Defaut` revient aux reglages standards.

## Maps

Le menu `Reglages` permet de choisir la map de la nouvelle partie. Changer de
map relance la partie avec les dimensions, murs et cellules de depart de la map
selectionnee.

## Couleur du serpent

Le menu `Reglages` permet aussi de choisir une couleur de serpent lisible sur
les themes disponibles. L'option `Garder pour Rejouer` conserve ce choix; si
elle est desactivee, `Rejouer` revient au vert par defaut.
