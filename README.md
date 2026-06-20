# Snake

Petit Snake web, modulaire et sans dependance runtime.

## Commandes

```sh
npm test
npm start
```

`npm start` sert le dossier sur `http://localhost:4173`.

## Vitesse

Le menu `Reglages` propose le mode `Standard` et le `Mode rapide`. En mode
standard, les vitesses `Lente`, `Normale`, `Rapide` et `Expert` restent
selectionnables et sauvegardees localement. Le mode rapide verrouille la
vitesse effective sur `Rapide` sans remplacer la vitesse manuelle sauvegardee.
Le bouton `Defaut` revient au mode standard et a la vitesse `Normale`.

## Maps

Le menu `Reglages` permet de choisir la map de la nouvelle partie. Changer de
map relance la partie avec les dimensions, murs et cellules de depart de la map
selectionnee.

## Couleur du serpent

Le menu `Reglages` permet aussi de choisir une couleur de serpent lisible sur
les themes disponibles. L'option `Garder pour Rejouer` conserve ce choix; si
elle est desactivee, `Rejouer` revient au vert par defaut.
